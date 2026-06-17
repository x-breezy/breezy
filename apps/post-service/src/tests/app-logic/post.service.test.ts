import { PostService } from "../../services/post.service"
import { PostModel } from "../../models/post.model"
import { LikeModel } from "../../models/like.model"
import { getActorProfile } from "../../clients/grpc.client"
import { publish } from "../../clients/rabbitmq"
import { deleteMediaItems } from "../../clients/media.grpc.client"

jest.mock("../../models/post.model")
jest.mock("../../models/like.model")
jest.mock("../../clients/grpc.client")
jest.mock("../../clients/rabbitmq")
jest.mock("../../clients/media.grpc.client")

const mockPostModel = PostModel as jest.Mocked<typeof PostModel>
const mockLikeModel = LikeModel as jest.Mocked<typeof LikeModel>
const mockGetActorProfile = getActorProfile as jest.MockedFunction<typeof getActorProfile>
const mockPublish = publish as jest.MockedFunction<typeof publish>
const mockDeleteMediaItems = deleteMediaItems as jest.MockedFunction<typeof deleteMediaItems>

function mockQuery(resolved: unknown) {
  return { exec: jest.fn().mockResolvedValue(resolved) }
}

function mockCount(value: number) {
  const p = Promise.resolve(value) as any
  p.exec = jest.fn().mockResolvedValue(value)
  return p
}

describe("PostService", () => {
  let service: PostService
  let mockFollow: { getFollowing: jest.Mock }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFollow = { getFollowing: jest.fn() }
    service = new PostService(mockFollow)
  })

  describe("createPost", () => {
    const baseData = {
      content: "Hello world",
      authorId: "user-1",
      mentions: [],
      tags: ["hello"],
      media: [],
    }

    it("creates a post without parent", async () => {
      const postDoc = { _id: "post-1", ...baseData, parentId: null, rootParentId: null }
      mockPostModel.create.mockResolvedValue(postDoc as any)

      const result = await service.createPost(baseData)

      expect(mockPostModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: "Hello world", authorId: "user-1" })
      )
      expect(result).toEqual(postDoc)
    })

    it("throws when parent post not found", async () => {
      mockPostModel.findById.mockReturnValue(mockQuery(null) as any)

      await expect(service.createPost({ ...baseData, parentId: "parent-1" })).rejects.toThrow(
        "Parent post not found"
      )
    })

    it("creates a reply and increments commentsCount, publishes reply notification", async () => {
      const parentDoc = { _id: "parent-1", authorId: "parent-author" }
      const replyDoc = {
        _id: "reply-1",
        content: "a reply",
        authorId: "user-1",
        parentId: "parent-1",
        rootParentId: "parent-1",
      }
      mockPostModel.findById.mockReturnValue(mockQuery(parentDoc) as any)
      mockPostModel.create.mockResolvedValue(replyDoc as any)
      mockPostModel.findByIdAndUpdate.mockReturnValue(mockQuery(undefined) as any)
      mockGetActorProfile.mockResolvedValue({
        username: "user1",
        avatarId: "av1",
        firstName: "User",
        lastName: "One",
        role: "user",
      })

      await service.createPost({ ...baseData, content: "a reply", parentId: "parent-1" })

      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith("parent-1", {
        $inc: { commentsCount: 1 },
      })
      expect(mockPublish).toHaveBeenCalledWith(
        "content.reply",
        expect.objectContaining({ targetUserId: "parent-author" })
      )
    })

    it("publishes mention notifications", async () => {
      const mentioned = "user-2"
      const postDoc = {
        _id: "post-m",
        authorId: "user-1",
        mentions: [mentioned],
        parentId: null,
        rootParentId: null,
      }
      mockPostModel.create.mockResolvedValue(postDoc as any)

      await service.createPost({ ...baseData, mentions: [mentioned] })

      expect(mockPublish).toHaveBeenCalledWith(
        "content.mention",
        expect.objectContaining({ targetUserId: mentioned })
      )
    })
  })

  describe("getPost", () => {
    it("returns post by id", async () => {
      const post = { _id: "post-1", content: "hello" }
      mockPostModel.findById.mockReturnValue(mockQuery(post) as any)

      const result = await service.getPost("post-1")
      expect(result).toEqual(post)
    })

    it("returns null when not found", async () => {
      mockPostModel.findById.mockReturnValue(mockQuery(null) as any)
      const result = await service.getPost("not-found")
      expect(result).toBeNull()
    })
  })

  describe("getPostDetail", () => {
    const VIEWER = "viewer-1"
    const AUTHOR = "author-1"

    beforeEach(() => {
      mockGetActorProfile.mockResolvedValue({
        username: "author",
        avatarId: "av1",
        firstName: "A",
        lastName: "U",
        role: "user",
      })
    })

    it("returns null when post not found", async () => {
      mockPostModel.findById.mockReturnValue(mockQuery(null) as any)
      const result = await service.getPostDetail("no-post", VIEWER)
      expect(result).toBeNull()
    })

    it("returns post detail with liked state and replies", async () => {
      const postDoc = {
        _id: "post-1",
        content: "hello",
        authorId: AUTHOR,
        parentId: null,
        toJSON: () => ({ _id: "post-1", content: "hello", authorId: AUTHOR }),
      }
      // First findById in getPostDetail
      mockPostModel.findById.mockReturnValueOnce(mockQuery(postDoc) as any)
      mockLikeModel.findOne.mockReturnValue(mockQuery({ _id: "like-1" }) as any)

      // getReplies flow: findById for rootPost
      const rootPostDoc = { _id: "post-1", authorId: AUTHOR }
      mockPostModel.findById.mockReturnValueOnce(mockQuery(rootPostDoc) as any)

      // countDocuments inside getReplies
      const countQ = mockCount(0)
      mockPostModel.countDocuments.mockReturnValue(countQ as any)

      // PostModel.find inside getReplies → attachReplies
      const roots: any[] = []
      const sortLeanMock = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(roots),
      }
      mockPostModel.find.mockReturnValue(sortLeanMock as any)

      // LikeModel.find for liked state on replies
      mockLikeModel.find.mockReturnValue(mockQuery([]) as any)

      const result = await service.getPostDetail("post-1", VIEWER)

      expect(result).not.toBeNull()
      expect(result!.likedByMe).toBe(true)
      expect(result!.replies).toEqual([])
    })
  })

  describe("feed", () => {
    it("returns paginated feed from following", async () => {
      mockFollow.getFollowing.mockResolvedValue(["user-2", "user-3"])
      const posts = [{ _id: "p1", authorId: "user-2" }]
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(posts),
      }
      mockPostModel.find.mockReturnValue(mockChain as any)
      const countQ = mockCount(1)
      mockPostModel.countDocuments.mockReturnValue(countQ as any)

      const result = await service.feed("viewer-1", 1, 10)

      expect(result.data).toEqual(posts)
      expect(result.total).toBe(1)
      expect(mockPostModel.find).toHaveBeenCalledWith({
        authorId: { $in: ["user-2", "user-3"], $ne: "viewer-1" },
        parentId: null,
      })
    })

    it("returns feed when not following anyone", async () => {
      mockFollow.getFollowing.mockResolvedValue(null)
      const posts = [{ _id: "p2", authorId: "other" }]
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(posts),
      }
      mockPostModel.find.mockReturnValue(mockChain as any)
      const countQ = mockCount(1)
      mockPostModel.countDocuments.mockReturnValue(countQ as any)

      const result = await service.feed("viewer-1", 1, 10)

      expect(result.data).toEqual(posts)
      expect(mockPostModel.find).toHaveBeenCalledWith({
        authorId: { $ne: "viewer-1" },
        parentId: null,
      })
    })
  })

  describe("byUser", () => {
    it("returns user posts without replies", async () => {
      const posts = [{ _id: "p1", authorId: "user-1" }]
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(posts),
      }
      mockPostModel.find.mockReturnValue(mockChain as any)
      const countQ = mockCount(1)
      mockPostModel.countDocuments.mockReturnValue(countQ as any)

      const result = await service.byUser("user-1", 1, 10)

      expect(result.data).toEqual(posts)
      expect(mockPostModel.find).toHaveBeenCalledWith({ authorId: "user-1", parentId: null })
    })

    it("includes replies when specified", async () => {
      const posts = [{ _id: "p1", authorId: "user-1", parentId: "parent-1" }]
      const mockChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(posts),
      }
      mockPostModel.find.mockReturnValue(mockChain as any)
      const countQ = mockCount(1)
      mockPostModel.countDocuments.mockReturnValue(countQ as any)

      const result = await service.byUser("user-1", 1, 10, true)

      expect(mockPostModel.find).toHaveBeenCalledWith({ authorId: "user-1" })
      expect(result.data).toEqual(posts)
    })
  })

  describe("updatePost", () => {
    it("updates post content", async () => {
      const updated = { _id: "p1", content: "updated" }
      mockPostModel.findByIdAndUpdate.mockReturnValue(mockQuery(updated) as any)

      const result = await service.updatePost("p1", "updated")

      expect(result).toEqual(updated)
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "p1",
        { content: "updated" },
        { new: true }
      )
    })

    it("updates content and media", async () => {
      const updated = { _id: "p1", content: "updated", media: [{ id: "m1", type: "image" }] }
      mockPostModel.findByIdAndUpdate.mockReturnValue(mockQuery(updated) as any)

      const result = await service.updatePost("p1", "updated", [{ id: "m1", type: "image" }])

      expect(result).toEqual(updated)
      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "p1",
        { content: "updated", media: [{ id: "m1", type: "image" }] },
        { new: true }
      )
    })

    it("returns null when post not found", async () => {
      mockPostModel.findByIdAndUpdate.mockReturnValue(mockQuery(null) as any)
      const result = await service.updatePost("not-found", "hello")
      expect(result).toBeNull()
    })
  })

  describe("deletePost", () => {
    it("deletes a post without parent or media", async () => {
      const post = { _id: "p1", authorId: "user-1", parentId: null, media: [] }
      mockPostModel.findById.mockReturnValue(mockQuery(post) as any)
      mockPostModel.findByIdAndDelete.mockReturnValue(mockQuery(post) as any)

      const result = await service.deletePost("p1")

      expect(result).toBe(true)
      expect(mockPostModel.findByIdAndDelete).toHaveBeenCalledWith("p1")
    })

    it("decrements commentsCount on parent when deleting reply", async () => {
      const reply = { _id: "p1", authorId: "user-1", parentId: "parent-1", media: [] }
      mockPostModel.findById.mockReturnValue(mockQuery(reply) as any)
      mockPostModel.findByIdAndDelete.mockReturnValue(mockQuery(reply) as any)
      mockPostModel.findByIdAndUpdate.mockReturnValue(mockQuery(undefined) as any)

      await service.deletePost("p1")

      expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith("parent-1", {
        $inc: { commentsCount: -1 },
      })
    })

    it("calls deleteMediaItems when post has media", async () => {
      const post = {
        _id: "p1",
        authorId: "user-1",
        parentId: null,
        media: [{ id: "m1", type: "image" }],
      }
      mockPostModel.findById.mockReturnValue(mockQuery(post) as any)
      mockPostModel.findByIdAndDelete.mockReturnValue(mockQuery(post) as any)

      await service.deletePost("p1")

      expect(mockDeleteMediaItems).toHaveBeenCalledWith([{ id: "m1", type: "image" }])
    })

    it("returns false when post not found", async () => {
      mockPostModel.findById.mockReturnValue(mockQuery(null) as any)

      const result = await service.deletePost("not-found")

      expect(result).toBe(false)
    })

    it("returns false when findByIdAndDelete returns null", async () => {
      const post = { _id: "p1", authorId: "user-1", parentId: null, media: [] }
      mockPostModel.findById.mockReturnValue(mockQuery(post) as any)
      mockPostModel.findByIdAndDelete.mockReturnValue(mockQuery(null) as any)

      const result = await service.deletePost("p1")
      expect(result).toBe(false)
    })

    it("deletePost accepts optional post argument", async () => {
      const post = { _id: "p1", authorId: "user-1", parentId: null, media: [] }
      mockPostModel.findByIdAndDelete.mockReturnValue(mockQuery(post) as any)

      const result = await service.deletePost("p1", post as any)

      expect(mockPostModel.findById).not.toHaveBeenCalled()
      expect(result).toBe(true)
    })
  })

  describe("getReplies", () => {
    const rootPost = { _id: "post-1", authorId: "author-1" }
    const rootPostQuery = { exec: jest.fn().mockResolvedValue(rootPost) }

    beforeEach(() => {
      mockPostModel.findById.mockReturnValue(rootPostQuery as any)
    })

    it("returns paginated replies", async () => {
      const roots: any[] = []
      const sortLeanMock = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(roots),
      }
      mockPostModel.find.mockReturnValue(sortLeanMock as any)
      const countQ = mockCount(0)
      mockPostModel.countDocuments.mockReturnValue(countQ as any)

      const result = await service.getReplies("post-1", 1, 10, "viewer-1")

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })

    it("returns replies with pagination skipped", async () => {
      const roots: any[] = [
        { _id: "r1", authorId: "reply-author", parentId: "post-1", content: "reply" },
      ]
      const sortLeanMock = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(roots),
      }
      mockPostModel.find.mockReturnValue(sortLeanMock as any)
      const countQ = mockCount(1)
      mockPostModel.countDocuments.mockReturnValue(countQ as any)
      mockLikeModel.find.mockReturnValue(mockQuery([]) as any)

      const result = await service.getReplies("post-1", 1, 999, "viewer-1", true)

      expect(result.data).toHaveLength(1)
    })
  })

  describe("getThread", () => {
    it("returns thread from post to root", async () => {
      const post = { _id: "p3", authorId: "user-1", parentId: "p2" }
      const parent = { _id: "p2", parentId: "p1" }
      const root = { _id: "p1", parentId: null }

      mockPostModel.findById
        .mockReturnValueOnce({
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(post),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(parent),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(root),
        })

      const result = await service.getThread("p3")

      expect(result).toEqual([root, parent])
    })

    it("stops when parent not found", async () => {
      const post = { _id: "orphan", authorId: "user-1", parentId: "ghost" }
      mockPostModel.findById
        .mockReturnValueOnce({
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(post),
        })
        .mockReturnValueOnce({
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(null),
        })

      const result = await service.getThread("orphan")
      expect(result).toEqual([])
    })
  })

  describe("search", () => {
    const POST = { _id: "p1", content: "hello world", authorId: "author-1", tags: ["hello"] }

    function mockSearchChain(data: unknown[]) {
      return {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(data),
      }
    }

    it("returns matching posts", async () => {
      mockPostModel.find.mockReturnValue(mockSearchChain([POST]) as any)
      const countQ = mockCount(1)
      mockPostModel.countDocuments.mockReturnValue(countQ as any)

      const result = await service.search("hello", 1, 10)

      expect(result.data).toEqual([POST])
      expect(result.total).toBe(1)
    })

    it("excludes viewer posts when viewerId provided", async () => {
      mockPostModel.find.mockReturnValue(mockSearchChain([]) as any)
      const countQ = mockCount(0)
      mockPostModel.countDocuments.mockReturnValue(countQ as any)

      const result = await service.search("hello", 1, 10, [], "viewer-1")

      expect(result.data).toEqual([])
    })

    it("searches by authorIds when provided", async () => {
      let callCount = 0
      mockPostModel.find.mockImplementation(() => {
        const isAuthorSearch = callCount === 3
        callCount++
        const data = isAuthorSearch ? [POST] : []
        return {
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(data),
        }
      })
      const countQ = mockCount(1)
      mockPostModel.countDocuments.mockReturnValue(countQ as any)

      const result = await service.search("hello", 1, 10, ["author-1"])

      expect(result.data).toEqual([POST])
    })

    it("returns empty for no matches", async () => {
      mockPostModel.find.mockReturnValue(mockSearchChain([]) as any)
      const countQ = mockCount(0)
      mockPostModel.countDocuments.mockReturnValue(countQ as any)

      const result = await service.search("zzz_nonexistent", 1, 10)

      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  describe("trendingTags", () => {
    it("caches results and respects limit", async () => {
      const tags = [
        { tag: "a", count: 3 },
        { tag: "b", count: 2 },
        { tag: "c", count: 1 },
      ]
      mockPostModel.aggregate = jest.fn().mockReturnValue(tags)

      const first = await service.trendingTags(10)
      expect(first).toEqual(tags)

      const second = await service.trendingTags(2)
      expect(second).toEqual([
        { tag: "a", count: 3 },
        { tag: "b", count: 2 },
      ])
      expect(mockPostModel.aggregate).toHaveBeenCalledTimes(1)
    })
  })
})
