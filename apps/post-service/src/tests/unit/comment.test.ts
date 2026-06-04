import CommentService from "../../services/comment.service"
import { CommentModel } from "../../models/comment.model"
import { PostModel } from "../../models/post.model"

jest.mock("../../models/comment.model", () => ({
  CommentModel: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
}))

jest.mock("../../models/post.model", () => ({
  PostModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}))

const mockedComment = CommentModel as jest.Mocked<typeof CommentModel>
const mockedPost = PostModel as jest.Mocked<typeof PostModel>

const POST_ID = "64f1a2b3c4d5e6f7a8b9c0d1"
const COMMENT_ID = "64f1a2b3c4d5e6f7a8b9c0d2"
const NOW = new Date("2026-01-01T00:00:00.000Z")

const MOCK_COMMENT = {
  id: COMMENT_ID,
  content: "Nice post!",
  authorId: "user-1",
  postId: POST_ID,
  parentCommentId: null,
  createdAt: NOW,
  updatedAt: NOW,
}

describe("CommentService", () => {
  let service: CommentService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new CommentService()
    ;(mockedPost.findByIdAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })
  })

  describe("deleteComment", () => {
    it("returns null when comment was already deleted", async () => {
      ;(mockedComment.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })

      const result = await service.deleteComment(COMMENT_ID)

      expect(result).toBeNull()
      expect(mockedPost.findByIdAndUpdate).not.toHaveBeenCalled()
    })

    it("decrements commentsCount and returns comment when found", async () => {
      ;(mockedComment.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(MOCK_COMMENT),
      })

      const result = await service.deleteComment(COMMENT_ID)

      expect(result).toBe(MOCK_COMMENT)
      expect(mockedPost.findByIdAndUpdate).toHaveBeenCalledWith(POST_ID, {
        $inc: { commentsCount: -1 },
      })
    })
  })

  describe("listComments", () => {
    it("returns paginated comments filtered by postId and parentCommentId", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([MOCK_COMMENT]),
      }
      ;(mockedComment.find as jest.Mock).mockReturnValue(mockQuery)
      ;(mockedComment.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await service.listComments(POST_ID, null, 1, 20)

      expect(mockedComment.find).toHaveBeenCalledWith({ postId: POST_ID, parentCommentId: null })
      expect(result).toEqual({ data: [MOCK_COMMENT], total: 1, page: 1, limit: 20 })
    })
  })
})
