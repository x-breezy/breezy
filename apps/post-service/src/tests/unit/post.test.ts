import PostService from "../../services/post.service"
import { PostModel } from "../../models/post.model"

jest.mock("../../models/post.model", () => ({
  PostModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}))

const mockedModel = PostModel as jest.Mocked<typeof PostModel>

const NOW = new Date("2026-01-01T00:00:00.000Z")

const MOCK_POST = {
  id: "abc",
  content: "Hello world",
  authorId: "user1",
  tags: ["tag1"],
  mediaIds: ["media1"],
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
        mediaIds: ["media1"],
      })

      expect(mockedModel.create).toHaveBeenCalledWith({
        content: "Hello world",
        authorId: "user1",
        tags: ["tag1"],
        mediaIds: ["media1"],
      })
      expect(result).toBe(MOCK_POST)
    })

    it("defaults tags and mediaIds to empty arrays", async () => {
      ;(mockedModel.create as jest.Mock).mockResolvedValue(MOCK_POST)

      await service.createPost({ content: "Hi", authorId: "user1" })

      expect(mockedModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ tags: [], mediaIds: [] })
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
      ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: "abc" }),
      })

      expect(await service.deletePost("abc")).toBe(true)
    })

    it("returns false when nothing matched", async () => {
      ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })

      expect(await service.deletePost("missing")).toBe(false)
    })
  })

  describe("feed", () => {
    it("returns paginated posts sorted by createdAt desc", async () => {
      const docs = [MOCK_POST]
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(docs),
      }
      ;(mockedModel.find as jest.Mock).mockReturnValue(mockQuery)
      ;(mockedModel.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await service.feed(1, 20)

      expect(mockedModel.find).toHaveBeenCalledWith({})
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 })
      expect(mockQuery.skip).toHaveBeenCalledWith(0)
      expect(mockQuery.limit).toHaveBeenCalledWith(20)
      expect(result).toEqual({ data: docs, total: 1, page: 1, limit: 20 })
    })

    it("computes skip correctly for page > 1", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }
      ;(mockedModel.find as jest.Mock).mockReturnValue(mockQuery)
      ;(mockedModel.countDocuments as jest.Mock).mockResolvedValue(0)

      await service.feed(3, 10)

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

      expect(mockedModel.find).toHaveBeenCalledWith({ authorId: "user1" })
      expect(mockedModel.countDocuments).toHaveBeenCalledWith({ authorId: "user1" })
      expect(result).toEqual({ data: [MOCK_POST], total: 1, page: 1, limit: 20 })
    })
  })
})
