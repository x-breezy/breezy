import { PostModel } from "../models/post.model"
import { LikeModel } from "../models/like.model"
import { forYouFeed } from "./for-you.algorithm"
import { getActorProfile } from "../clients/grpc.client"
import type { CreatePostDTO } from "../schemas/post.schema"
import type { Post } from "../types/post"
import type { PostDetail, ReplyPost, ProfileRef } from "../types/post-detail"
import type { PaginatedResponse } from "../types/api"
import { GrpcFollowGraph, type FollowGraphPort } from "../clients/follow-graph"
import { publish } from "../clients/rabbitmq"
import { getBannedUserIds } from "../clients/banned-users.consumer"
import { deleteMediaItems } from "../clients/media.grpc.client"

const NEST_DEPTH = 2
const MENTION_RE = /@([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi

interface TrendingCache {
  data: { tag: string; count: number }[]
  expiresAt: number
}

let trendingCache: TrendingCache | null = null
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function extractMentions(content: string, authorId: string): string[] {
  const matches = [...content.matchAll(MENTION_RE)].map((m) => m[1]!.toLowerCase())
  return [...new Set(matches)].filter((id) => id !== authorId)
}

export class PostService {
  constructor(private follow: FollowGraphPort = new GrpcFollowGraph()) {}

  async createPost(data: CreatePostDTO & { authorId: string }): Promise<Post> {
    const mentions = data.mentions ?? extractMentions(data.content, data.authorId)

    let rootParentId: string | undefined
    if (data.parentId) {
      const parent = await PostModel.findById(data.parentId).exec()
      if (!parent)
        throw Object.assign(new Error("Parent post not found"), { code: "POST_NOT_FOUND" })
      rootParentId = parent.rootParentId ?? data.parentId
    }

    const post = await PostModel.create({
      content: data.content,
      authorId: data.authorId,
      tags: data.tags ?? [],
      mentions,
      media: data.media ?? [],
      parentId: data.parentId ?? null,
      rootParentId: rootParentId ?? null,
    })
    const postId = String(post._id)

    if (data.parentId) {
      await PostModel.findByIdAndUpdate(data.parentId, { $inc: { commentsCount: 1 } }).exec()
    }

    const filteredMentions = mentions.filter((id) => id !== data.authorId)
    const profile =
      filteredMentions.length > 0 || data.parentId ? await getActorProfile(data.authorId) : null

    for (const targetUserId of filteredMentions) {
      void publish("content.mention", {
        actorId: data.authorId,
        targetUserId,
        postId,
        username: profile?.username,
        avatarId: profile?.avatarId,
      })
    }

    if (data.parentId) {
      const parent = await PostModel.findById(data.parentId).exec()
      if (parent && parent.authorId !== data.authorId) {
        void publish("content.reply", {
          actorId: data.authorId,
          targetUserId: parent.authorId,
          postId: rootParentId ?? data.parentId,
          replyPostId: postId,
          username: profile?.username,
          avatarId: profile?.avatarId,
        })
      }
    }

    return post
  }

  async getPost(id: string): Promise<Post | null> {
    const post = (await PostModel.findById(id).exec()) as Post | null
    if (!post) return post
    const banned = await getBannedUserIds()
    if (banned.has(post.authorId)) return null
    return post
  }

  async getPostDetail(postId: string, viewerId: string): Promise<PostDetail | null> {
    const doc = await PostModel.findById(postId).exec()
    if (!doc) return null
    const banned = await getBannedUserIds()
    if (banned.has((doc as unknown as { authorId: string }).authorId)) return null
    const post = doc.toJSON() as Record<string, unknown> & Post

    const [likedDoc, repliesResult] = await Promise.all([
      LikeModel.findOne({ postId, userId: viewerId }).exec(),
      this.getReplies(postId, 1, 999, viewerId, true),
    ])

    const likedByMe = likedDoc !== null

    const authorIds = new Set<string>([post.authorId])
    const collectIds = (replies: ReplyPost[]) => {
      for (const r of replies) {
        authorIds.add(r.authorId)
        collectIds(r.replies)
      }
    }
    collectIds(repliesResult.data)

    const profileEntries = await Promise.allSettled(
      [...authorIds].map(async (id) => {
        const profile = await getActorProfile(id)
        return { id, profile }
      })
    )

    const profiles = new Map<string, ProfileRef | null>()
    for (const entry of profileEntries) {
      if (entry.status === "fulfilled" && entry.value.profile) {
        profiles.set(entry.value.id, {
          username: entry.value.profile.username,
          avatarId: entry.value.profile.avatarId,
          firstName: entry.value.profile.firstName,
          lastName: entry.value.profile.lastName,
          role: entry.value.profile.role,
        })
      } else if (entry.status === "fulfilled") {
        profiles.set(entry.value.id, null)
      }
    }

    const attachAuthor = (replies: ReplyPost[]): ReplyPost[] =>
      replies.map((r) => ({
        ...r,
        author: profiles.get(r.authorId) ?? null,
        replies: attachAuthor(r.replies),
      }))

    const postAuthor = profiles.get(post.authorId) ?? null

    return {
      post: {
        ...post,
        author: postAuthor,
      },
      likedByMe,
      replies: attachAuthor(repliesResult.data),
    }
  }

  async forYouFeed(
    viewerId: string,
    page: number,
    limit: number
  ): Promise<PaginatedResponse<Post> & { parentPosts: Record<string, Post> }> {
    const result = await forYouFeed(viewerId, page, limit)

    const replies = result.data.filter((p) => p.parentId)
    const parentIds = [...new Set(replies.map((r) => r.parentId!))]

    const banned = await getBannedUserIds()
    let parentPosts: Post[] = []
    if (parentIds.length > 0) {
      const bannedParentFilter = banned.size > 0 ? { authorId: { $nin: [...banned] } } : {}
      parentPosts = (await PostModel.find({ _id: { $in: parentIds }, ...bannedParentFilter })
        .lean({ virtuals: true })
        .exec()) as Post[]
    }

    const parentIdSet = new Set(
      parentPosts.map((p) => String((p as unknown as { _id: string })._id))
    )

    const filteredData = result.data.filter((p) => {
      if (p.parentId) return true
      return !parentIdSet.has(String((p as unknown as { _id: string })._id))
    })

    return {
      data: filteredData,
      parentPosts: Object.fromEntries(
        parentPosts.map((p) => [String((p as unknown as { _id: string })._id), p])
      ),
      total: result.total,
      page: result.page,
      limit: result.limit,
    }
  }

  async feed(viewerId: string, page: number, limit: number): Promise<PaginatedResponse<Post>> {
    const [following, banned] = await Promise.all([
      this.follow.getFollowing(viewerId),
      getBannedUserIds(),
    ])
    if (following !== null && following.length === 0) {
      return { data: [], total: 0, page, limit }
    }
    const allowedIds =
      following === null ? null : [...new Set(following)].filter((id) => !banned.has(id))
    const authorFilter =
      allowedIds === null
        ? { $nin: [...banned, viewerId] }
        : { $in: allowedIds.filter((id) => id !== viewerId) }
    const filter = {
      authorId: authorFilter,
      // top-level posts or direct replies only (parentId === rootParentId means depth-1)
      $or: [{ parentId: null }, { $expr: { $eq: ["$parentId", "$rootParentId"] } }],
    }
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      PostModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      PostModel.countDocuments(filter),
    ])
    return { data: data as Post[], total, page, limit }
  }

  async byUser(
    userId: string,
    page: number,
    limit: number,
    type: "posts" | "replies" | "media" | "all" = "posts",
    viewerRole?: string
  ): Promise<PaginatedResponse<Post>> {
    if (viewerRole !== "admin") {
      const banned = await getBannedUserIds()
      if (banned.has(userId)) return { data: [], total: 0, page, limit }
    }
    const filter: Record<string, unknown> = { authorId: userId }
    if (type === "posts") filter.parentId = null
    else if (type === "replies") filter.parentId = { $ne: null }
    else if (type === "media") filter.media = { $exists: true, $not: { $size: 0 } }
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      PostModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      PostModel.countDocuments(filter),
    ])
    return { data: data as Post[], total, page, limit }
  }

  async updatePost(
    id: string,
    content: string,
    media?: { id: string; type: string }[]
  ): Promise<Post | null> {
    const update: Record<string, unknown> = { content }
    if (media !== undefined) update.media = media
    return PostModel.findByIdAndUpdate(id, update, { new: true }).exec() as Promise<Post | null>
  }

  async deletePost(id: string, post: Post | null = null): Promise<boolean> {
    if (!post) {
      post = (await PostModel.findById(id).exec()) as Post | null
      if (!post) return false
    }

    const deleted = await PostModel.findByIdAndDelete(id).exec()
    if (!deleted) return false

    if (post.parentId) {
      await PostModel.findByIdAndUpdate(post.parentId, {
        $inc: { commentsCount: -1 },
      }).exec()
    }

    if (post.media?.length) {
      void deleteMediaItems(post.media as { id: string; type: "image" | "video" }[])
    }

    return true
  }

  private async attachReplies(
    posts: Post[],
    depth: number,
    rootAuthorId?: string,
    viewerId?: string,
    banned?: Set<string>
  ): Promise<ReplyPost[]> {
    const filteredPosts = banned?.size ? posts.filter((p) => !banned.has(p.authorId)) : posts
    if (filteredPosts.length === 0 || depth >= NEST_DEPTH) {
      return filteredPosts.map((p) => ({
        ...p,
        author: null,
        likedByMe: false,
        replies: [],
      })) as unknown as ReplyPost[]
    }

    const ids = filteredPosts.map((p) =>
      String((p as unknown as Record<string, unknown>)._id ?? p.id)
    )
    // depth=1 fetches level-2 replies only show root author's responses
    const childFilter: Record<string, unknown> = { parentId: { $in: ids } }
    if (depth === 1 && rootAuthorId) childFilter.authorId = rootAuthorId
    const children = (await PostModel.find(childFilter)
      .sort({ createdAt: 1 })
      .lean({ virtuals: true })
      .exec()) as Post[]
    this.sortByOwnerFirst(children, rootAuthorId, viewerId)
    const nestedChildren = await this.attachReplies(
      children,
      depth + 1,
      rootAuthorId,
      viewerId,
      banned
    )

    const repliesByParent = new Map<string, ReplyPost[]>()
    for (const child of nestedChildren) {
      const childParentId = child.parentId
      if (!childParentId) continue
      const bucket = repliesByParent.get(childParentId) ?? []
      bucket.push(child)
      repliesByParent.set(childParentId, bucket)
    }

    return filteredPosts.map((p) => {
      const id = String((p as unknown as Record<string, unknown>)._id ?? p.id)
      return { ...p, author: null, likedByMe: false, replies: repliesByParent.get(id) ?? [] }
    }) as unknown as ReplyPost[]
  }

  private collectReplyIds(replies: ReplyPost[]): string[] {
    const ids: string[] = []
    for (const r of replies) {
      ids.push(r._id)
      ids.push(...this.collectReplyIds(r.replies))
    }
    return ids
  }

  private attachLikedState(replies: ReplyPost[], likedSet: Set<string>): void {
    for (const r of replies) {
      if (likedSet.has(String(r._id))) r.likedByMe = true
      this.attachLikedState(r.replies, likedSet)
    }
  }

  private sortByOwnerFirst(
    posts: (Post | ReplyPost)[],
    rootAuthorId?: string,
    viewerId?: string
  ): void {
    posts.sort((a, b) => {
      const aViewer = a.authorId === viewerId ? 0 : a.authorId === rootAuthorId ? 1 : 2
      const bViewer = b.authorId === viewerId ? 0 : b.authorId === rootAuthorId ? 1 : 2
      if (aViewer !== bViewer) return aViewer - bViewer
      return 0
    })
  }

  async getReplies(
    postId: string,
    page: number,
    limit: number,
    viewerId?: string,
    skipPagination?: boolean
  ): Promise<PaginatedResponse<ReplyPost>> {
    const banned = await getBannedUserIds()

    const [rootPost, roots, total] = await Promise.all([
      PostModel.findById(postId).exec(),
      (() => {
        let q = PostModel.find({ parentId: postId }).sort({ createdAt: 1 })
        if (!skipPagination) q = q.skip((page - 1) * limit).limit(limit)
        return q.lean({ virtuals: true }).exec()
      })(),
      PostModel.countDocuments({ parentId: postId }),
    ])

    const rootAuthorId = rootPost?.authorId
    const filteredRoots = (roots as Post[]).filter((p) => !banned.has(p.authorId))
    this.sortByOwnerFirst(filteredRoots, rootAuthorId, viewerId)

    const nested = await this.attachReplies(filteredRoots, 1, rootAuthorId, viewerId, banned)

    if (viewerId) {
      const allIds = this.collectReplyIds(nested)
      if (allIds.length > 0) {
        const likedDocs = await LikeModel.find({ postId: { $in: allIds }, userId: viewerId }).exec()
        const likedSet = new Set(likedDocs.map((d) => String(d.postId)))
        this.attachLikedState(nested, likedSet)
      }
    }

    return { data: nested, total, page, limit }
  }

  async getThread(postId: string): Promise<Post[]> {
    const banned = await getBannedUserIds()
    const thread: Post[] = []
    let current = (await PostModel.findById(postId).lean({ virtuals: true }).exec()) as Post | null
    while (current?.parentId) {
      const parent = (await PostModel.findById(current.parentId)
        .lean({ virtuals: true })
        .exec()) as Post | null
      if (!parent) break
      if (!banned.has(parent.authorId)) thread.unshift(parent)
      current = parent
    }
    return thread
  }

  async search(
    q: string,
    page: number,
    limit: number,
    authorIds?: string[],
    viewerId?: string
  ): Promise<PaginatedResponse<Post>> {
    const bannedIds = await getBannedUserIds()
    const bannedFilter = bannedIds.size > 0 ? { authorId: { $nin: [...bannedIds] } } : {}
    const skip = (page - 1) * limit
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const tagRegex = new RegExp(`^${escaped}$`, "i")
    const contentRegex = new RegExp(escaped, "i")
    const safeQ = q.replace(/"/g, '\\"')
    const exclude = viewerId ? { authorId: { $ne: viewerId } } : {}
    const baseFilter = { ...exclude, ...bannedFilter }

    // Fetch: exact tag match first, then text-score ranked, then regex fallback
    const fetchLimit = skip + limit
    const tagDocs = await PostModel.find({ tags: tagRegex, ...baseFilter })
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .exec()

    const textDocs = await PostModel.find(
      { $text: { $search: `"${safeQ}"` }, ...baseFilter },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(fetchLimit)
      .exec()

    const regexDocs = await PostModel.find({ content: contentRegex, ...baseFilter })
      .sort({ createdAt: -1 })
      .limit(fetchLimit)
      .exec()

    // Posts from matching authors (people search cross-join)
    const filteredAuthorIds = authorIds?.filter((id) => !bannedIds.has(id))
    const authorDocs =
      filteredAuthorIds && filteredAuthorIds.length > 0
        ? await PostModel.find({
            authorId: { $in: filteredAuthorIds, ...(viewerId ? { $ne: viewerId } : {}) },
          })
            .sort({ createdAt: -1 })
            .limit(fetchLimit)
            .exec()
        : []

    // Merge and deduplicate while preserving priority order
    const seen = new Set<string>()
    const merged: Post[] = []
    for (const doc of [...tagDocs, ...textDocs, ...regexDocs, ...authorDocs]) {
      const id = doc._id.toString()
      if (seen.has(id)) continue
      seen.add(id)
      merged.push(doc as Post)
    }

    // Count distinct matching documents (avoid $text in $or which MongoDB rejects)
    const countPromises: Promise<number>[] = [
      PostModel.countDocuments({ tags: tagRegex, ...baseFilter }).exec(),
      PostModel.countDocuments({ $text: { $search: `"${safeQ}"` }, ...baseFilter }).exec(),
      PostModel.countDocuments({ content: contentRegex, ...baseFilter }).exec(),
    ]
    if (filteredAuthorIds && filteredAuthorIds.length > 0) {
      countPromises.push(
        PostModel.countDocuments({
          authorId: { $in: filteredAuthorIds, ...(viewerId ? { $ne: viewerId } : {}) },
        }).exec()
      )
    }
    const counts = await Promise.all(countPromises)

    // Approximate total (upper bound); exact dedup would need another fetch
    const total = Math.max(...counts)
    if (total === 0 && merged.length === 0) {
      return { data: [], total: 0, page, limit }
    }

    const data = merged.slice(skip, skip + limit)
    return { data, total: Math.max(total, merged.length), page, limit }
  }

  async trendingTags(limit: number = 10): Promise<{ tag: string; count: number }[]> {
    if (trendingCache && Date.now() < trendingCache.expiresAt) {
      return trendingCache.data.slice(0, limit)
    }

    const banned = await getBannedUserIds()
    const pipeline: import("mongoose").PipelineStage[] = []
    if (banned.size > 0) pipeline.push({ $match: { authorId: { $nin: [...banned] } } })
    pipeline.push(
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, tag: "$_id", count: 1 } }
    )
    const results = await PostModel.aggregate(pipeline)

    trendingCache = {
      data: results as { tag: string; count: number }[],
      expiresAt: Date.now() + CACHE_TTL_MS,
    }

    return results.slice(0, limit) as { tag: string; count: number }[]
  }
}

export default PostService
