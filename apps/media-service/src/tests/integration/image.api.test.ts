import request from "supertest"
import { verifyJwt } from "../../utils/jwt"
import { createApp } from "../../app"
import { ImageModel } from "../../models/image.model"

jest.mock("../../models/image.model", () => ({
  ImageModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}))

jest.mock("sharp", () =>
  jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    toFormat: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from("optimized")),
  }))
)

jest.mock("../../utils/jwt")
const mockVerifyJwt = verifyJwt as jest.MockedFunction<typeof verifyJwt>

const mockedModel = ImageModel as jest.Mocked<typeof ImageModel>
const app = createApp()

const PNG = Buffer.from("\x89PNG\r\n\x1a\n", "binary")
const OPTIMIZED = Buffer.from("optimized")
const NOW = new Date("2026-01-01T00:00:00.000Z")

const MOCK_DOC = {
  id: "abc",
  data: PNG,
  originalName: "test.png",
  size: PNG.length,
  mimeType: "image/png",
  ownerId: "user-1",
  createdAt: NOW,
  updatedAt: NOW,
}

const UPLOADED_DOC = {
  ...MOCK_DOC,
  data: OPTIMIZED,
  size: OPTIMIZED.length,
  mimeType: "image/jpeg",
}

beforeEach(() => {
  jest.clearAllMocks()
  mockVerifyJwt.mockReturnValue({ sub: "user-1", role: "user" })
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

// ─── POST /images ───────────────────────────────────────────────────────────

describe("POST /images", () => {
  it("stores an optimized JPEG image and returns metadata (no bytes) in ApiResponse", async () => {
    ;(mockedModel.create as jest.Mock).mockResolvedValue(UPLOADED_DOC)

    const res = await request(app)
      .post("/images")
      .set("Content-Type", "image/png")
      .set("x-filename", "test.png")
      .set("Authorization", "Bearer fake-token")
      .send(PNG)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        id: "abc",
        size: OPTIMIZED.length,
        mimeType: "image/jpeg",
        createdAt: NOW.toISOString(),
      }),
    })
    expect(res.body.data.data).toBeUndefined()
    expect(mockedModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ originalName: "test.png", mimeType: "image/jpeg" })
    )
  })

  it("uses 'upload' as default filename when x-filename header absent", async () => {
    ;(mockedModel.create as jest.Mock).mockResolvedValue(UPLOADED_DOC)

    const res = await request(app)
      .post("/images")
      .set("Content-Type", "image/png")
      .set("Authorization", "Bearer fake-token")
      .send(PNG)

    expect(res.status).toBe(201)
    expect(mockedModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ originalName: "upload" })
    )
  })

  it("rejects an empty body with 400", async () => {
    const res = await request(app)
      .post("/images")
      .set("Content-Type", "image/png")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(mockedModel.create).not.toHaveBeenCalled()
  })

  it("rejects missing content-type with 400", async () => {
    const res = await request(app)
      .post("/images")
      .set("Content-Type", "")
      .set("Authorization", "Bearer fake-token")
      .send(PNG)

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(mockedModel.create).not.toHaveBeenCalled()
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).post("/images").set("Content-Type", "image/png").send(PNG)
    expect(res.status).toBe(401)
  })
})

// ─── GET /images/:id ────────────────────────────────────────────────────────

describe("GET /images/:id", () => {
  it("returns raw bytes with correct content-type", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_DOC),
    })

    const res = await request(app)
      .get("/images/abc")
      .set("Authorization", "Bearer fake-token")
      .responseType("blob")

    expect(res.status).toBe(200)
    expect(res.headers["content-type"]).toContain("image/png")
    expect(Buffer.from(res.body).equals(PNG)).toBe(true)
  })

  it("returns 404 for an unknown id", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app)
      .get("/images/0123456789abcdef01234567")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(404)
  })

  it("returns raw bytes without auth", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_DOC),
    })

    const res = await request(app).get("/images/abc").responseType("blob")

    expect(res.status).toBe(200)
    expect(res.headers["content-type"]).toContain("image/png")
    expect(Buffer.from(res.body).equals(PNG)).toBe(true)
  })
})

// ─── GET /images/:id/meta ───────────────────────────────────────────────────

describe("GET /images/:id/meta", () => {
  it("returns metadata JSON without bytes", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_DOC),
    })

    const res = await request(app)
      .get("/images/abc/meta")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({ id: "abc", mimeType: "image/png" }),
    })
    expect(res.body.data.data).toBeUndefined()
  })

  it("returns 404 for an unknown id", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app)
      .get("/images/0123456789abcdef01234567/meta")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/images/abc/meta")
    expect(res.status).toBe(401)
  })
})

// ─── DELETE /images/:id ─────────────────────────────────────────────────────

describe("DELETE /images/:id", () => {
  it("allows owner to delete own image", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_DOC),
    })
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: "abc" }),
    })

    const res = await request(app)
      .delete("/images/abc")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true, message: "Image deleted successfully" })
  })

  it("returns 403 when non-owner user tries to delete", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_DOC), // ownerId: "user-1"
    })

    mockVerifyJwt.mockReturnValueOnce({ sub: "user-2", role: "user" })
    const res = await request(app)
      .delete("/images/abc")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(403)
    expect(res.body.success).toBe(false)
  })

  it("allows moderator to delete any image", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_DOC),
    })
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: "abc" }),
    })

    mockVerifyJwt.mockReturnValueOnce({ sub: "user-2", role: "moderator" })
    const res = await request(app)
      .delete("/images/abc")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("allows admin to delete any image", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_DOC),
    })
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: "abc" }),
    })

    mockVerifyJwt.mockReturnValueOnce({ sub: "user-2", role: "admin" })
    const res = await request(app)
      .delete("/images/abc")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("returns 404 when image not found", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app)
      .delete("/images/0123456789abcdef01234567")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it("returns 404 when image is deleted between ownership check and service call", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_DOC), // ownership passes
    })
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null), // service returns false
    })

    const res = await request(app)
      .delete("/images/abc")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).delete("/images/abc")
    expect(res.status).toBe(401)
  })
})

// ─── Error handler (500) ─────────────────────────────────────────────────────

describe("image controller error handling", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  it("returns 500 when ImageService.uploadImage throws", async () => {
    ;(mockedModel.create as jest.Mock).mockRejectedValue(new Error("db error"))

    const res = await request(app)
      .post("/images")
      .set("Content-Type", "image/png")
      .set("Authorization", "Bearer fake-token")
      .send(PNG)

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ success: false, error: "Internal server error" })
  })

  it("returns 500 when ImageService.getImage throws on GET /:id", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error("db error")),
    })

    const res = await request(app)
      .get("/images/abc")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(500)
  })

  it("returns 500 when ImageService.getImage throws on GET /:id/meta", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error("db error")),
    })

    const res = await request(app)
      .get("/images/abc/meta")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(500)
  })

  it("returns 500 when ImageService.deleteImage throws", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_DOC),
    })
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockRejectedValue(new Error("db error")),
    })

    const res = await request(app)
      .delete("/images/abc")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(500)
  })
})
