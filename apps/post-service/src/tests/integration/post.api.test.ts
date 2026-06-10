import request from "supertest"
import { createApp } from "../../app"
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

// No USER_SERVICE_URL in test env -> HttpFollowGraph.getFollowing returns null -> global feed.
// Personalized filtering is covered by unit tests (injected fake FollowGraphPort).

const mockedModel = PostModel as jest.Mocked<typeof PostModel>
const app = createApp()

const USER1_UUID = "11111111-1111-1111-1111-111111111111"
const USER2_UUID = "22222222-2222-2222-2222-222222222222"

const NOW = new Date("2026-01-01T00:00:00.000Z")

const MOCK_POST = {
  id: "abc",
  content: "Hello world",
  authorId: USER1_UUID,
  tags: ["tag1"],
  media: [{ id: "media1", type: "image" }],
  createdAt: NOW,
  updatedAt: NOW,
}

function mockFindPaginated(docs: unknown[], total: number) {
  const mockQuery = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(docs),
  }
  ;(mockedModel.find as jest.Mock).mockReturnValue(mockQuery)
  ;(mockedModel.countDocuments as jest.Mock).mockResolvedValue(total)
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── Health ────────────────────────────────────────────────────────────────

describe("GET /", () => {
  it("returns status ok", async () => {
    const res = await request(app).get("/")
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: "ok" })
  })
})

describe("GET /docs.json", () => {
  it("returns the OpenAPI spec as JSON", async () => {
    const res = await request(app).get("/docs.json")
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("openapi")
  })
})

// ─── POST /posts ────────────────────────────────────────────────────────────

describe("POST /posts", () => {
  it("creates a post and returns it in ApiResponse", async () => {
    ;(mockedModel.create as jest.Mock).mockResolvedValue(MOCK_POST)

    const res = await request(app)
      .post("/posts")
      .set("Content-Type", "application/json")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")
      .send({ content: "Hello world", tags: ["tag1"], media: [{ id: "media1", type: "image" }] })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        id: "abc",
        content: "Hello world",
        authorId: USER1_UUID,
        tags: ["tag1"],
        media: [{ id: "media1", type: "image" }],
        createdAt: NOW.toISOString(),
      }),
    })
    expect(mockedModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Hello world", authorId: USER1_UUID })
    )
  })

  it("returns 401 when auth header is missing", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Content-Type", "application/json")
      .send({ content: "Hello world" })

    expect(res.status).toBe(401)
    expect(res.body.success).toBe(false)
    expect(mockedModel.create).not.toHaveBeenCalled()
  })

  it("returns 400 when content is empty", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Content-Type", "application/json")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")
      .send({ content: "" })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(mockedModel.create).not.toHaveBeenCalled()
  })

  it("returns 400 when content is absent", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Content-Type", "application/json")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it("defaults tags and media to empty arrays", async () => {
    ;(mockedModel.create as jest.Mock).mockResolvedValue({
      ...MOCK_POST,
      tags: [],
      media: [],
    })

    await request(app)
      .post("/posts")
      .set("Content-Type", "application/json")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")
      .send({ content: "Just text" })

    expect(mockedModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ tags: [], media: [] })
    )
  })
})

// ─── GET /posts/:id ─────────────────────────────────────────────────────────

describe("GET /posts/:id", () => {
  it("returns a post by id", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_POST),
    })

    const res = await request(app)
      .get("/posts/abc")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({ id: "abc", content: "Hello world" }),
    })
  })

  it("returns 404 for unknown id", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app)
      .get("/posts/notfound")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/posts/abc")
    expect(res.status).toBe(401)
  })
})

// ─── GET /posts/feed ────────────────────────────────────────────────────────

describe("GET /posts/feed", () => {
  it("returns paginated posts newest-first", async () => {
    mockFindPaginated([MOCK_POST], 1)

    const res = await request(app)
      .get("/posts/feed")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        data: expect.arrayContaining([expect.objectContaining({ id: "abc" })]),
        total: 1,
        page: 1,
        limit: 20,
      }),
    })
  })

  it("respects ?page and ?limit query params", async () => {
    mockFindPaginated([], 100)

    const res = await request(app)
      .get("/posts/feed?page=3&limit=5")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ page: 3, limit: 5, total: 100 })
  })

  it("is not caught by the /:id route", async () => {
    mockFindPaginated([], 0)

    const res = await request(app)
      .get("/posts/feed")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    // If routed to /:id, findById would be called (not find) and data would not have total
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("total")
  })

  it("uses global filter when user-service unavailable (no USER_SERVICE_URL)", async () => {
    mockFindPaginated([MOCK_POST], 1)

    await request(app).get("/posts/feed").set("x-user-id", USER1_UUID).set("x-role", "user")

    expect(mockedModel.find).toHaveBeenCalledWith({})
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/posts/feed")
    expect(res.status).toBe(401)
  })
})

// ─── GET /posts/users/:userId ────────────────────────────────────────────────

describe("GET /posts/users/:userId", () => {
  it("returns posts filtered by userId (self-access)", async () => {
    mockFindPaginated([MOCK_POST], 1)

    const res = await request(app)
      .get(`/posts/users/${USER1_UUID}`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        data: expect.arrayContaining([expect.objectContaining({ authorId: USER1_UUID })]),
        total: 1,
        page: 1,
        limit: 20,
      }),
    })
    expect(mockedModel.find).toHaveBeenCalledWith({ authorId: USER1_UUID })
  })

  it("returns empty list for user with no posts", async () => {
    mockFindPaginated([], 0)

    const res = await request(app)
      .get(`/posts/users/${USER1_UUID}`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ data: [], total: 0 })
  })

  it("returns 403 when user accesses another user's posts", async () => {
    const res = await request(app)
      .get(`/posts/users/${USER2_UUID}`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it("allows moderator to access any user's posts", async () => {
    mockFindPaginated([MOCK_POST], 1)

    const res = await request(app)
      .get(`/posts/users/${USER2_UUID}`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "moderator")

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("allows admin to access any user's posts", async () => {
    mockFindPaginated([MOCK_POST], 1)

    const res = await request(app)
      .get(`/posts/users/${USER2_UUID}`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "admin")

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).get(`/posts/users/${USER1_UUID}`)
    expect(res.status).toBe(401)
  })
})

// ─── DELETE /posts/:id ───────────────────────────────────────────────────────

describe("DELETE /posts/:id", () => {
  it("allows owner to delete own post", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ authorId: USER1_UUID }),
    })
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: "abc" }),
    })

    const res = await request(app)
      .delete("/posts/abc")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ success: true, message: "Post deleted successfully" })
  })

  it("returns 404 when post not found", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app)
      .delete("/posts/notfound")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it("returns 403 when non-owner user tries to delete", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ authorId: USER2_UUID }),
    })

    const res = await request(app)
      .delete("/posts/abc")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it("allows moderator to delete any post", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ authorId: USER2_UUID }),
    })
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: "abc" }),
    })

    const res = await request(app)
      .delete("/posts/abc")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "moderator")

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("allows admin to delete any post", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ authorId: USER2_UUID }),
    })
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: "abc" }),
    })

    const res = await request(app)
      .delete("/posts/abc")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "admin")

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("returns 404 when post is deleted between ownership check and deletion", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ authorId: USER1_UUID }),
    })
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app)
      .delete("/posts/abc")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).delete("/posts/abc")
    expect(res.status).toBe(401)
  })
})

// ─── Error handler (500) ─────────────────────────────────────────────────────

describe("global error handler", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  it("returns 500 when PostModel.create throws", async () => {
    ;(mockedModel.create as jest.Mock).mockRejectedValue(new Error("db error"))

    const res = await request(app)
      .post("/posts")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")
      .send({ content: "Hello" })

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ success: false, error: "Internal server error" })
  })

  it("returns 500 when PostModel.findById throws on GET /:id", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error("db error")),
    })

    const res = await request(app)
      .get("/posts/abc")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(500)
  })

  it("returns 500 when PostModel.find throws on GET /feed", async () => {
    ;(mockedModel.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(new Error("db error")),
    })
    ;(mockedModel.countDocuments as jest.Mock).mockResolvedValue(0)

    const res = await request(app)
      .get("/posts/feed")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(500)
  })

  it("returns 500 when PostModel.find throws on GET /users/:userId", async () => {
    ;(mockedModel.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockRejectedValue(new Error("db error")),
    })
    ;(mockedModel.countDocuments as jest.Mock).mockResolvedValue(0)

    const res = await request(app)
      .get(`/posts/users/${USER1_UUID}`)
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(500)
  })

  it("returns 500 when PostModel.findByIdAndDelete throws on DELETE /:id", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ authorId: USER1_UUID }),
    })
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error("db error")),
    })

    const res = await request(app)
      .delete("/posts/abc")
      .set("x-user-id", USER1_UUID)
      .set("x-role", "user")

    expect(res.status).toBe(500)
  })
})
