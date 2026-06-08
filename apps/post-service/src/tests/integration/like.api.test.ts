import request from "supertest"
import { createApp } from "../../app"
import { PostModel } from "../../models/post.model"
import { LikeModel } from "../../models/like.model"

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

jest.mock("../../models/like.model", () => ({
  LikeModel: {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}))

const mockedPost = PostModel as jest.Mocked<typeof PostModel>
const mockedLike = LikeModel as jest.Mocked<typeof LikeModel>
const app = createApp()

const USER1_UUID = "11111111-1111-1111-1111-111111111111"
const POST_ID = "64f1a2b3c4d5e6f7a8b9c0d1"

beforeEach(() => {
  jest.clearAllMocks()
  ;(mockedPost.findByIdAndUpdate as jest.Mock).mockReturnValue({
    exec: jest.fn().mockResolvedValue({ likesCount: 0 }),
  })
})

// ─── POST /posts/:id/likes ───────────────────────────────────────────────────

describe("POST /posts/:id/likes", () => {
  it("likes a post and returns 201", async () => {
    ;(mockedPost.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: POST_ID }),
    })
    ;(mockedLike.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })
    ;(mockedLike.create as jest.Mock).mockResolvedValue({})
    ;(mockedPost.findByIdAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ likesCount: 5 }),
    })

    const res = await request(app)
      .post(`/posts/${POST_ID}/likes`)
      .set("x-user-id", USER1_UUID)
      .set("x-roles", "user")

    expect(res.status).toBe(201)
    expect(res.body).toEqual({
      success: true,
      message: "Like added successfully",
      data: { likesCount: 5 },
    })
    expect(mockedPost.findByIdAndUpdate).toHaveBeenCalledWith(
      POST_ID,
      { $inc: { likesCount: 1 } },
      { new: true }
    )
  })

  it("returns 409 when already liked", async () => {
    ;(mockedPost.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: POST_ID }),
    })
    ;(mockedLike.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ postId: POST_ID, userId: USER1_UUID }),
    })

    const res = await request(app)
      .post(`/posts/${POST_ID}/likes`)
      .set("x-user-id", USER1_UUID)
      .set("x-roles", "user")

    expect(res.status).toBe(409)
    expect(res.body.success).toBe(false)
    expect(mockedLike.create).not.toHaveBeenCalled()
  })

  it("returns 404 when post not found", async () => {
    ;(mockedPost.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app)
      .post(`/posts/${POST_ID}/likes`)
      .set("x-user-id", USER1_UUID)
      .set("x-roles", "user")

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
    expect(mockedLike.create).not.toHaveBeenCalled()
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).post(`/posts/${POST_ID}/likes`)
    expect(res.status).toBe(401)
  })
})

// ─── DELETE /posts/:id/likes ─────────────────────────────────────────────────

describe("DELETE /posts/:id/likes", () => {
  it("unlikes a post and returns 200", async () => {
    ;(mockedPost.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: POST_ID }),
    })
    ;(mockedLike.findOneAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ postId: POST_ID, userId: USER1_UUID }),
    })
    ;(mockedPost.findByIdAndUpdate as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ likesCount: 3 }),
    })

    const res = await request(app)
      .delete(`/posts/${POST_ID}/likes`)
      .set("x-user-id", USER1_UUID)
      .set("x-roles", "user")

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      success: true,
      message: "Like removed successfully",
      data: { likesCount: 3 },
    })
    expect(mockedPost.findByIdAndUpdate).toHaveBeenCalledWith(
      POST_ID,
      { $inc: { likesCount: -1 } },
      { new: true }
    )
  })

  it("returns 404 when like not found", async () => {
    ;(mockedLike.findOneAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app)
      .delete(`/posts/${POST_ID}/likes`)
      .set("x-user-id", USER1_UUID)
      .set("x-roles", "user")

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).delete(`/posts/${POST_ID}/likes`)
    expect(res.status).toBe(401)
  })
})

// ─── Error handler (500) ─────────────────────────────────────────────────────

describe("like controller error handling", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  it("returns 500 when LikeModel.findOne throws on POST", async () => {
    ;(mockedPost.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: POST_ID }),
    })
    ;(mockedLike.findOne as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error("db error")),
    })

    const res = await request(app)
      .post(`/posts/${POST_ID}/likes`)
      .set("x-user-id", USER1_UUID)
      .set("x-roles", "user")

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ success: false, error: "Internal server error" })
  })

  it("returns 500 when LikeModel.findOneAndDelete throws on DELETE", async () => {
    ;(mockedLike.findOneAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error("db error")),
    })

    const res = await request(app)
      .delete(`/posts/${POST_ID}/likes`)
      .set("x-user-id", USER1_UUID)
      .set("x-roles", "user")

    expect(res.status).toBe(500)
  })
})
