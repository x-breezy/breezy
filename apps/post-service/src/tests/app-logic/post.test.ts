import PostService from "../../services/post.service"
import { PostModel } from "../../models/post.model"
import type { FollowGraphPort } from "../../clients/follow-graph"

jest.mock("../../models/post.model", () => ({
  PostModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}))

const mockedModel = PostModel as jest.Mocked<typeof PostModel>

const NOW = new Date("2026-01-01T00:00:00.000Z")

const MOCK_POST = {
  _id: { toString: () => "abc" },
  id: "abc",
  content: "Hello world",
  authorId: "user1",
  tags: ["tag1"],
  media: [{ id: "media1", type: "image" }],
  createdAt: NOW,
  updatedAt: NOW,
}

describe("PostService", () => {
  let service: PostService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new PostService()
  })

  describe("createPost", () => {
    it("calls PostModel.create with dto and returns result", async () => {
      ;(mockedModel.create as jest.Mock).mockResolvedValue(MOCK_POST)

      const result = await service.createPost({
        content: "Hello world",
        authorId: "user1",
        tags: ["tag1"],
        media: [{ id: "media1", type: "image" }],
      })

      expect(mockedModel.create).toHaveBeenCalledWith({
        content: "Hello world",
        authorId: "user1",
        tags: ["tag1"],
        mentions: [],
        media: [{ id: "media1", type: "image" }],
        parentId: null,
        rootParentId: null,
      })
      expect(result).toBe(MOCK_POST)
    })

    it("defaults tags and media to empty arrays", async () => {
      ;(mockedModel.create as jest.Mock).mockResolvedValue(MOCK_POST)

      await service.createPost({ content: "Hi", authorId: "user1" })

      expect(mockedModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ tags: [], mentions: [], media: [] })
      )
    })
  })

  describe("getPost", () => {
    it("returns document by id", async () => {
      ;(mockedModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(MOCK_POST),
      })

      expect(await service.getPost("abc")).toBe(MOCK_POST)
      expect(mockedModel.findById).toHaveBeenCalledWith("abc")
    })

    it("returns null when not found", async () => {
      ;(mockedModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })

      expect(await service.getPost("missing")).toBeNull()
    })
  })

  describe("deletePost", () => {
    it("returns true when document was removed", async () => {
      ;(mockedModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: "abc" }),
      })
      ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: "abc" }),
      })

      expect(await service.deletePost("abc")).toBe(true)
    })

    it("returns false when nothing matched", async () => {
      ;(mockedModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })

      expect(await service.deletePost("missing")).toBe(false)
    })
  })

  describe("feed", () => {
    const makeQuery = (docs: (typeof MOCK_POST)[] = []) => ({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(docs),
    })

    const makeFollow = (result: string[] | null): FollowGraphPort => ({
      getFollowing: jest.fn().mockResolvedValue(result),
    })

    it("uses global filter when follow graph returns null (user-service unavailable)", async () => {
      const docs = [MOCK_POST]
      const mockQuery = makeQuery(docs)
      ;(mockedModel.find as jest.Mock).mockReturnValue(mockQuery)
      ;(mockedModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const svc = new PostService(makeFollow(null))
      const result = await svc.feed("user1", 1, 20)

      expect(mockedModel.find).toHaveBeenCalledWith({
        authorId: { $ne: "user1" },
        $or: [{ parentId: null }, { $expr: { $eq: ["$parentId", "$rootParentId"] } }],
      })
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(mockQuery.skip).toHaveBeenCalledWith(0)
      expect(mockQuery.limit).toHaveBeenCalledWith(20)
      expect(result).toEqual({ data: docs, total: 1, page: 1, limit: 20 })
    })

    it("filters by following + viewer when follow graph returns ids", async () => {
      const mockQuery = makeQuery([MOCK_POST])
      ;(mockedModel.find as jest.Mock).mockReturnValue(mockQuery)
      ;(mockedModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const svc = new PostService(makeFollow(["user2", "user3"]))
      await svc.feed("user1", 1, 20)

      expect(mockedModel.find).toHaveBeenCalledWith({
        authorId: { $in: expect.arrayContaining(["user2", "user3"]), $ne: "user1" },
        $or: [{ parentId: null }, { $expr: { $eq: ["$parentId", "$rootParentId"] } }],
      })
    })

    it("returns empty when following is empty", async () => {
      const svc = new PostService(makeFollow([]))
      const result = await svc.feed("user1", 1, 20)

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 })
      expect(mockedModel.find).not.toHaveBeenCalled()
    })

    it("excludes viewer from $in even if present in following list", async () => {
      const mockQuery = makeQuery([])
      ;(mockedModel.find as jest.Mock).mockReturnValue(mockQuery)
      ;(mockedModel.countDocuments as jest.Mock).mockResolvedValue(0)

      const svc = new PostService(makeFollow(["user1", "user2"])) // user1 already viewer
      await svc.feed("user1", 1, 20)

      expect(mockedModel.find).toHaveBeenCalledWith({
        authorId: { $in: expect.arrayContaining(["user2"]), $ne: "user1" },
        $or: [{ parentId: null }, { $expr: { $eq: ["$parentId", "$rootParentId"] } }],
      })
    })

    it("computes skip correctly for page > 1 (null graph)", async () => {
      const mockQuery = makeQuery([])
      ;(mockedModel.find as jest.Mock).mockReturnValue(mockQuery)
      ;(mockedModel.countDocuments as jest.Mock).mockResolvedValue(0)

      const svc = new PostService(makeFollow(null))
      await svc.feed("user1", 3, 10)

      expect(mockQuery.skip).toHaveBeenCalledWith(20) // (3-1) * 10
    })
  })

  describe("byUser", () => {
    it("filters by authorId", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([MOCK_POST]),
      }
      ;(mockedModel.find as jest.Mock).mockReturnValue(mockQuery)
      ;(mockedModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await service.byUser("user1", 1, 20)

      expect(mockedModel.find).toHaveBeenCalledWith({ authorId: "user1", parentId: null })
      expect(mockedModel.countDocuments).toHaveBeenCalledWith({ authorId: "user1", parentId: null })
      expect(result).toEqual({ data: [MOCK_POST], total: 1, page: 1, limit: 20 })
    })
  })

  describe("search", () => {
    const makeQuery = (docs: (typeof MOCK_POST)[] = []) => ({
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(docs),
    })
    const makeCountQuery = (n: number) => ({ exec: jest.fn().mockResolvedValue(n) })

    it("queries with $text, tags regex, content regex and merges deduped results", async () => {
      const mockQuery = makeQuery([MOCK_POST])
      ;(mockedModel.find as jest.Mock).mockReturnValue(mockQuery)
      ;(mockedModel.countDocuments as jest.Mock).mockReturnValue(makeCountQuery(1))

      const result = await service.search("typescript", 1, 20)

      expect(mockedModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ $text: { $search: '"typescript"' } }),
        expect.anything()
      )
      expect(result.data).toHaveLength(1)
      expect(result.total).toBeGreaterThanOrEqual(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it("applies page offset correctly for page > 1", async () => {
      const emptyQuery = makeQuery([])
      ;(mockedModel.find as jest.Mock).mockReturnValue(emptyQuery)
      ;(mockedModel.countDocuments as jest.Mock).mockReturnValue(makeCountQuery(0))

      const result = await service.search("hello", 3, 10)

      expect(result.page).toBe(3)
      expect(result.limit).toBe(10)
    })

    it("returns empty results when nothing matches", async () => {
      const emptyQuery = makeQuery([])
      ;(mockedModel.find as jest.Mock).mockReturnValue(emptyQuery)
      ;(mockedModel.countDocuments as jest.Mock).mockReturnValue(makeCountQuery(0))

      const result = await service.search("noresult", 1, 20)

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 })
    })
  })

  describe("trendingTags", () => {
    let dateSpy: jest.SpyInstance

    beforeEach(() => {
      dateSpy = jest.spyOn(Date, "now").mockReturnValue(0)
    })

    afterEach(() => {
      dateSpy.mockRestore()
    })

    it("returns aggregated tags sorted by count", async () => {
      const mockTags = [
        { tag: "TypeScript", count: 42 },
        { tag: "React", count: 30 },
      ]
      ;(mockedModel.aggregate as jest.Mock).mockResolvedValue(mockTags)

      const result = await service.trendingTags(10)

      expect(mockedModel.aggregate).toHaveBeenCalledWith([
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, tag: "$_id", count: 1 } },
      ])
      expect(result).toEqual(mockTags)
    })

    it("uses default limit of 10", async () => {
      dateSpy.mockReturnValue(10 * 60 * 1000)
      ;(mockedModel.aggregate as jest.Mock).mockResolvedValue([])

      await service.trendingTags()

      expect(mockedModel.aggregate).toHaveBeenCalledWith(expect.arrayContaining([{ $limit: 10 }]))
    })
  })
})
