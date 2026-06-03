import request from "supertest"
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

const mockedModel = ImageModel as jest.Mocked<typeof ImageModel>
const app = createApp()

const PNG = Buffer.from("\x89PNG\r\n\x1a\n", "binary")
const NOW = new Date("2026-01-01T00:00:00.000Z")

const MOCK_DOC = {
  id: "abc",
  data: PNG,
  originalName: "test.png",
  size: PNG.length,
  mimeType: "image/png",
  createdAt: NOW,
  updatedAt: NOW,
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

describe("POST /images", () => {
  it("stores an image and returns metadata (no bytes) in ApiResponse", async () => {
    ;(mockedModel.create as jest.Mock).mockResolvedValue(MOCK_DOC)

    const res = await request(app)
      .post("/images")
      .set("Content-Type", "image/png")
      .set("x-filename", "test.png")
      .send(PNG)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        id: "abc",
        size: PNG.length,
        mimeType: "image/png",
        createdAt: NOW.toISOString(),
      }),
    })
    expect(res.body.data.data).toBeUndefined()
    expect(mockedModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ originalName: "test.png", mimeType: "image/png" })
    )
  })

  it("uses 'upload' as default filename when x-filename header absent", async () => {
    ;(mockedModel.create as jest.Mock).mockResolvedValue(MOCK_DOC)

    const res = await request(app)
      .post("/images")
      .set("Content-Type", "image/png")
      .send(PNG)

    expect(res.status).toBe(201)
    expect(mockedModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ originalName: "upload" })
    )
  })

  it("rejects an empty body with 400", async () => {
    const res = await request(app).post("/images").set("Content-Type", "image/png")
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(mockedModel.create).not.toHaveBeenCalled()
  })

  it("rejects missing content-type with 400 (raw middleware skips parse → empty body)", async () => {
    const res = await request(app)
      .post("/images")
      .set("Content-Type", "")
      .send(PNG)

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(mockedModel.create).not.toHaveBeenCalled()
  })
})

describe("GET /images/:id", () => {
  it("returns raw bytes with correct content-type", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_DOC),
    })

    const res = await request(app).get("/images/abc").responseType("blob")

    expect(res.status).toBe(200)
    expect(res.headers["content-type"]).toContain("image/png")
    expect(Buffer.from(res.body).equals(PNG)).toBe(true)
  })

  it("returns 404 for an unknown id", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app).get("/images/0123456789abcdef01234567")
    expect(res.status).toBe(404)
  })
})

describe("GET /images/:id/meta", () => {
  it("returns metadata JSON without bytes", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_DOC),
    })

    const res = await request(app).get("/images/abc/meta")

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

    const res = await request(app).get("/images/0123456789abcdef01234567/meta")
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

describe("DELETE /images/:id", () => {
  it("removes an existing image and returns success", async () => {
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: "abc" }),
    })

    const res = await request(app).delete("/images/abc")
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true, data: null })
  })

  it("returns 404 when nothing matched", async () => {
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app).delete("/images/0123456789abcdef01234567")
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})
