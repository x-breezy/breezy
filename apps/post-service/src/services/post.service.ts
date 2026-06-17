import { PostModel } from "../models/post.model"
import { LikeModel } from "../models/like.model"
import { getActorProfile } from "../clients/grpc.client"
import type { CreatePostDTO } from "../schemas/post.schema"
import type { Post } from "../types/post"
import type { PostDetail, ReplyPost, ProfileRef } from "../types/post-detail"
import type { PaginatedResponse } from "../types/api"
import { GrpcFollowGraph, type FollowGraphPort } from "../clients/follow-graph"
import { publish } from "../clients/rabbitmq"

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

    for (const targetUserId of mentions.filter((id) => id !== data.authorId)) {
      void publish("content.mention", { actorId: data.authorId, targetUserId, postId })
    }

    if (data.parentId) {
      const parent = await PostModel.findById(data.parentId).exec()
      if (parent && parent.authorId !== data.authorId) {
        const profile = await getActorProfile(data.authorId)
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
    return PostModel.findById(id).exec() as Promise<Post | null>
  }

  async getPostDetail(postId: string, viewerId: string): Promise<PostDetail | null> {
    const doc = await PostModel.findById(postId).exec()
    if (!doc) return null
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

  async feed(viewerId: string, page: number, limit: number): Promise<PaginatedResponse<Post>> {
    const following = await this.follow.getFollowing(viewerId)
    const filter: Record<string, unknown> =
      following === null
        ? { authorId: { $ne: viewerId }, parentId: null }
        : {
            authorId: { $in: [...new Set(following)], $ne: viewerId },
            parentId: null,
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
    includeReplies = false
  ): Promise<PaginatedResponse<Post>> {
    const filter: Record<string, unknown> = { authorId: userId }
    if (!includeReplies) filter.parentId = null
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      PostModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      PostModel.countDocuments(filter),
    ])
    return { data: data as Post[], total, page, limit }
  }

  async deletePost(id: string): Promise<boolean> {
    const post = await PostModel.findById(id).exec()
    if (!post) return false

    const deleted = await PostModel.findByIdAndDelete(id).exec()
    if (!deleted) return false

    if (post.parentId) {
      await PostModel.findByIdAndUpdate(post.parentId, {
        $inc: { commentsCount: -1 },
      }).exec()
    }

    return true
  }

  private async attachReplies(
    posts: Post[],
    depth: number,
    rootAuthorId?: string,
    viewerId?: string
  ): Promise<ReplyPost[]> {
    if (posts.length === 0 || depth >= NEST_DEPTH) {
      return posts.map((p) => ({
        ...p,
        author: null,
        likedByMe: false,
        replies: [],
      })) as unknown as ReplyPost[]
    }

    const ids = posts.map((p) => String(p.id))
    // depth=1 fetches level-2 replies — only show root author's responses
    const childFilter: Record<string, unknown> = { parentId: { $in: ids } }
    if (depth === 1 && rootAuthorId) childFilter.authorId = rootAuthorId
    console.log(
      `[attachReplies] depth=${depth} ids=${JSON.stringify(ids)} rootAuthorId=${rootAuthorId} filter=${JSON.stringify(childFilter)}`
    )
    const children = (await PostModel.find(childFilter)
      .sort({ createdAt: 1 })
      .lean({ virtuals: true })
      .exec()) as Post[]
    console.log(
      `[attachReplies] depth=${depth} children found: ${children.length}`,
      children.map((c) => ({ id: String(c.id), authorId: c.authorId, parentId: c.parentId }))
    )

    this.sortByOwnerFirst(children, rootAuthorId, viewerId)
    const nestedChildren = await this.attachReplies(children, depth + 1, rootAuthorId, viewerId)

    const repliesByParent = new Map<string, ReplyPost[]>()
    for (const child of nestedChildren) {
      const childParentId = child.parentId
      if (!childParentId) continue
      const bucket = repliesByParent.get(childParentId) ?? []
      bucket.push(child)
      repliesByParent.set(childParentId, bucket)
    }

    return posts.map((p) => {
      const id = String(p.id)
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
    this.sortByOwnerFirst(roots as Post[], rootAuthorId, viewerId)

    const nested = await this.attachReplies(roots as Post[], 1, rootAuthorId, viewerId)

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
    const thread: Post[] = []
    let current = (await PostModel.findById(postId).lean({ virtuals: true }).exec()) as Post | null
    while (current?.parentId) {
      const parent = (await PostModel.findById(current.parentId)
        .lean({ virtuals: true })
        .exec()) as Post | null
      if (!parent) break
      thread.unshift(parent)
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
    const skip = (page - 1) * limit
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const tagRegex = new RegExp(`^${escaped}$`, "i")
    const contentRegex = new RegExp(escaped, "i")
    const safeQ = q.replace(/"/g, '\\"')
    const exclude = viewerId ? { authorId: { $ne: viewerId } } : {}

    // Fetch: exact tag match first, then text-score ranked, then regex fallback
    const tagDocs = await PostModel.find({ tags: tagRegex, ...exclude })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec()

    const textDocs = await PostModel.find(
      { $text: { $search: `"${safeQ}"` }, ...exclude },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .exec()

    const regexDocs = await PostModel.find({ content: contentRegex, ...exclude })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec()

    // Posts from matching authors (people search cross-join)
    const authorDocs =
      authorIds && authorIds.length > 0
        ? await PostModel.find({
            authorId: { $in: authorIds, ...(viewerId ? { $ne: viewerId } : {}) },
          })
            .sort({ createdAt: -1 })
            .limit(limit)
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
      PostModel.countDocuments({ tags: tagRegex, ...exclude }).exec(),
      PostModel.countDocuments({ $text: { $search: `"${safeQ}"` }, ...exclude }).exec(),
      PostModel.countDocuments({ content: contentRegex, ...exclude }).exec(),
    ]
    if (authorIds && authorIds.length > 0) {
      countPromises.push(
        PostModel.countDocuments({
          authorId: { $in: authorIds, ...(viewerId ? { $ne: viewerId } : {}) },
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

    const results = await PostModel.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, tag: "$_id", count: 1 } },
    ])

    trendingCache = {
      data: results as { tag: string; count: number }[],
      expiresAt: Date.now() + CACHE_TTL_MS,
    }

    return results.slice(0, limit) as { tag: string; count: number }[]
  }
}

export default PostService
