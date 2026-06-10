import request from "supertest"
import { createApp } from "../../app"
import { PostModel } from "../../models/post.model"
import { CommentModel } from "../../models/comment.model"

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

jest.mock("../../models/comment.model", () => ({
  CommentModel: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
  },
}))

const mockedPost = PostModel as jest.Mocked<typeof PostModel>
const mockedComment = CommentModel as jest.Mocked<typeof CommentModel>
const app = createApp()

const USER1_UUID = "11111111-1111-1111-1111-111111111111"
const USER2_UUID = "22222222-2222-2222-2222-222222222222"
const POST_ID = "64f1a2b3c4d5e6f7a8b9c0d1"
const COMMENT_ID = "64f1a2b3c4d5e6f7a8b9c0d2"
const NOW = new Date("2026-01-01T00:00:00.000Z")

const MOCK_COMMENT = {
  id: COMMENT_ID,
  content: "Nice post!",
  authorId: USER1_UUID,
  postId: POST_ID,
  parentCommentId: null,
  createdAt: NOW,
  updatedAt: NOW,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(mockedPost.findByIdAndUpdate as jest.Mock).mockReturnValue({
    exec: jest.fn().mockResolvedValue({ commentsCount: 5 }),
  })
})

// ─── GET /posts/:id/comments ─────────────────────────────────────────────────

describe("GET /posts/:id/comments", () => {
  it("returns paginated top-level comments", async () => {
    const childQuery = {
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }
    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([MOCK_COMMENT]),
    }
    ;(mockedComment.find as jest.Mock).mockReturnValueOnce(mockQuery).mockReturnValue(childQuery)
    ;(mockedComment.countDocuments as jest.Mock).mockResolvedValue(1)

    const res = await request(app)
      .get(`/posts/${POST_ID}/comments`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        data: expect.arrayContaining([expect.objectContaining({ id: COMMENT_ID })]),
        total: 1,
        page: 1,
        limit: 20,
      }),
    })
    expect(mockedComment.find).toHaveBeenCalledWith({ postId: POST_ID, parentCommentId: null })
  })

  it("filters replies by parentCommentId", async () => {
    const mockQuery = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    }
    ;(mockedComment.find as jest.Mock).mockReturnValue(mockQuery)
    ;(mockedComment.countDocuments as jest.Mock).mockResolvedValue(0)

    await request(app)
      .get(`/posts/${POST_ID}/comments?parentCommentId=${COMMENT_ID}`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(mockedComment.find).toHaveBeenCalledWith({
      postId: POST_ID,
      parentCommentId: COMMENT_ID,
    })
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).get(`/posts/${POST_ID}/comments`)
    expect(res.status).toBe(401)
  })
})

// ─── POST /posts/:id/comments ────────────────────────────────────────────────

describe("POST /posts/:id/comments", () => {
  it("creates a comment and returns 201", async () => {
    ;(mockedPost.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: POST_ID }),
    })
    ;(mockedComment.create as jest.Mock).mockResolvedValue(MOCK_COMMENT)

    const res = await request(app)
      .post(`/posts/${POST_ID}/comments`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")
      .send({ content: "Nice post!" })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      success: true,
      data: {
        comment: expect.objectContaining({ id: COMMENT_ID, content: "Nice post!" }),
        commentsCount: 5,
      },
    })
    expect(mockedPost.findByIdAndUpdate).toHaveBeenCalledWith(
      POST_ID,
      { $inc: { commentsCount: 1 } },
      { new: true }
    )
  })

  it("creates a reply when parentCommentId is provided", async () => {
    ;(mockedPost.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: POST_ID }),
    })
    ;(mockedComment.create as jest.Mock).mockResolvedValue({
      ...MOCK_COMMENT,
      parentCommentId: COMMENT_ID,
    })

    const res = await request(app)
      .post(`/posts/${POST_ID}/comments`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")
      .send({ content: "Replying!", parentCommentId: COMMENT_ID })

    expect(res.status).toBe(201)
    expect(mockedComment.create).toHaveBeenCalledWith(
      expect.objectContaining({ parentCommentId: COMMENT_ID })
    )
  })

  it("returns 404 when post not found", async () => {
    ;(mockedPost.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app)
      .post(`/posts/${POST_ID}/comments`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")
      .send({ content: "Nice post!" })

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(mockedComment.create).not.toHaveBeenCalled()
  })

  it("returns 400 when content is empty", async () => {
    const res = await request(app)
      .post(`/posts/${POST_ID}/comments`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")
      .send({ content: "" })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(mockedComment.create).not.toHaveBeenCalled()
  })

  it("returns 400 when content exceeds 280 chars", async () => {
    const res = await request(app)
      .post(`/posts/${POST_ID}/comments`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")
      .send({ content: "x".repeat(281) })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .post(`/posts/${POST_ID}/comments`)
      .send({ content: "Nice post!" })
    expect(res.status).toBe(401)
  })
})

// ─── DELETE /posts/:id/comments/:commentId ───────────────────────────────────

describe("DELETE /posts/:id/comments/:commentId", () => {
  it("allows owner to delete own comment", async () => {
    ;(mockedComment.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_COMMENT),
    })
    ;(mockedComment.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_COMMENT),
    })

    const res = await request(app)
      .delete(`/posts/${POST_ID}/comments/${COMMENT_ID}`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ success: true, data: { commentsCount: 5 } })
    expect(mockedPost.findByIdAndUpdate).toHaveBeenCalledWith(
      POST_ID,
      [{ $set: { commentsCount: { $max: [0, { $subtract: ["$commentsCount", 1] }] } } }],
      { new: true }
    )
  })

  it("returns 403 when non-owner user tries to delete", async () => {
    ;(mockedComment.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_COMMENT),
    })

    const res = await request(app)
      .delete(`/posts/${POST_ID}/comments/${COMMENT_ID}`)
      .set("x-user-id", USER2_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it("allows moderator to delete any comment", async () => {
    ;(mockedComment.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_COMMENT),
    })
    ;(mockedComment.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_COMMENT),
    })

    const res = await request(app)
      .delete(`/posts/${POST_ID}/comments/${COMMENT_ID}`)
      .set("x-user-id", USER2_UUID)
      .set("x-role", "moderator")

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("allows admin to delete any comment", async () => {
    ;(mockedComment.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_COMMENT),
    })
    ;(mockedComment.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_COMMENT),
    })

    const res = await request(app)
      .delete(`/posts/${POST_ID}/comments/${COMMENT_ID}`)
      .set("x-user-id", USER2_UUID)
      .set("x-role", "admin")

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("returns 404 when comment not found", async () => {
    ;(mockedComment.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app)
      .delete(`/posts/${POST_ID}/comments/${COMMENT_ID}`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).delete(`/posts/${POST_ID}/comments/${COMMENT_ID}`)
    expect(res.status).toBe(401)
  })
})

// ─── Error handler (500) ─────────────────────────────────────────────────────

describe("comment controller error handling", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  it("returns 500 when CommentModel.find throws on GET", async () => {
    ;(mockedComment.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(new Error("db error")),
    })
    ;(mockedComment.countDocuments as jest.Mock).mockResolvedValue(0)

    const res = await request(app)
      .get(`/posts/${POST_ID}/comments`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ success: false, error: "Internal server error" })
  })

  it("returns 500 when CommentModel.create throws on POST", async () => {
    ;(mockedPost.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: POST_ID }),
    })
    ;(mockedComment.create as jest.Mock).mockRejectedValue(new Error("db error"))

    const res = await request(app)
      .post(`/posts/${POST_ID}/comments`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")
      .send({ content: "Nice!" })

    expect(res.status).toBe(500)
  })

  it("returns 500 when CommentModel.findByIdAndDelete throws on DELETE", async () => {
    ;(mockedComment.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_COMMENT),
    })
    ;(mockedComment.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error("db error")),
    })

    const res = await request(app)
      .delete(`/posts/${POST_ID}/comments/${COMMENT_ID}`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(500)
  })
})
