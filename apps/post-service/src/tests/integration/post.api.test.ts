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

const mockedModel = PostModel as jest.Mocked<typeof PostModel>
const app = createApp()

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

describe("POST /posts", () => {
  it("creates a post and returns it in ApiResponse", async () => {
    ;(mockedModel.create as jest.Mock).mockResolvedValue(MOCK_POST)

    const res = await request(app)
      .post("/posts")
      .set("Content-Type", "application/json")
      .set("x-owner-id", "user1")
      .send({ content: "Hello world", tags: ["tag1"], mediaIds: ["media1"] })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        id: "abc",
        content: "Hello world",
        authorId: "user1",
        tags: ["tag1"],
        mediaIds: ["media1"],
        createdAt: NOW.toISOString(),
      }),
    })
    expect(mockedModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ content: "Hello world", authorId: "user1" })
    )
  })

  it("returns 400 when x-owner-id header is missing", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Content-Type", "application/json")
      .send({ content: "Hello world" })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(mockedModel.create).not.toHaveBeenCalled()
  })

  it("returns 400 when content is empty", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Content-Type", "application/json")
      .set("x-owner-id", "user1")
      .send({ content: "" })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(mockedModel.create).not.toHaveBeenCalled()
  })

  it("returns 400 when content is absent", async () => {
    const res = await request(app)
      .post("/posts")
      .set("Content-Type", "application/json")
      .set("x-owner-id", "user1")
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it("defaults tags and mediaIds to empty arrays", async () => {
    ;(mockedModel.create as jest.Mock).mockResolvedValue({
      ...MOCK_POST,
      tags: [],
      mediaIds: [],
    })

    await request(app)
      .post("/posts")
      .set("Content-Type", "application/json")
      .set("x-owner-id", "user1")
      .send({ content: "Just text" })

    expect(mockedModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ tags: [], mediaIds: [] })
    )
  })
})

describe("GET /posts/:id", () => {
  it("returns a post by id", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_POST),
    })

    const res = await request(app).get("/posts/abc")

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

    const res = await request(app).get("/posts/notfound")
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

describe("DELETE /posts/:id", () => {
  it("deletes a post and returns success", async () => {
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: "abc" }),
    })

    const res = await request(app).delete("/posts/abc")
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("returns 404 when post not found", async () => {
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app).delete("/posts/notfound")
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

describe("GET /posts/feed", () => {
  it("returns paginated posts newest-first", async () => {
    mockFindPaginated([MOCK_POST], 1)

    const res = await request(app).get("/posts/feed")

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

    const res = await request(app).get("/posts/feed?page=3&limit=5")

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ page: 3, limit: 5, total: 100 })
  })

  it("is not caught by the /:id route", async () => {
    mockFindPaginated([], 0)

    const res = await request(app).get("/posts/feed")
    // If the route was misrouted to /:id handler, it would try to find post with id "feed"
    // and return 200 { success: true, data: {paginated} } — not a 404 from findById
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("total")
  })
})

describe("GET /posts/users/:userId", () => {
  it("returns posts filtered by userId", async () => {
    mockFindPaginated([MOCK_POST], 1)

    const res = await request(app).get("/posts/users/user1")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        data: expect.arrayContaining([expect.objectContaining({ authorId: "user1" })]),
        total: 1,
        page: 1,
        limit: 20,
      }),
    })
    // Must query with authorId filter
    expect(mockedModel.find).toHaveBeenCalledWith({ authorId: "user1" })
  })

  it("returns empty list for user with no posts", async () => {
    mockFindPaginated([], 0)

    const res = await request(app).get("/posts/users/nobody")

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ data: [], total: 0 })
  })
})
