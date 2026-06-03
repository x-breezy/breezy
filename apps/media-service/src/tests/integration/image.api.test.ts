// Validate the image API endpoints with supertest. The DB layer is mocked,
// so these exercise routing + controller wiring without a real MongoDB.
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

const mockedModel = ImageModel as jest.Mocked<typeof ImageModel>
const app = createApp()

const PNG = Buffer.from("\x89PNG\r\n\x1a\n", "binary")

beforeEach(() => {
  jest.clearAllMocks()
})

describe("POST /images", () => {
  it("stores an image and returns its metadata", async () => {
    const now = new Date("2026-01-01T00:00:00.000Z")
    ;(mockedModel.create as jest.Mock).mockResolvedValue({
      id: "abc",
      originalName: "test.png",
      size: PNG.length,
      mimeType: "image/png",
      createdAt: now,
      updatedAt: now,
    })

    const res = await request(app)
      .post("/images")
      .set("Content-Type", "image/png")
      .set("x-filename", "test.png")
      .send(PNG)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      id: "abc",
      size: PNG.length,
      mimeType: "image/png",
      createdAt: now.toISOString(),
    })
    expect(mockedModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ originalName: "test.png", mimeType: "image/png" }),
    )
  })

  it("rejects an empty body with 400", async () => {
    const res = await request(app).post("/images").set("Content-Type", "image/png")
    expect(res.status).toBe(400)
    expect(mockedModel.create).not.toHaveBeenCalled()
  })
})

describe("GET /images/:id", () => {
  it("returns the stored bytes with the original content type", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ data: PNG, mimeType: "image/png" }),
    })

    const res = await request(app).get("/images/abc").responseType("blob")

    expect(res.status).toBe(200)
    expect(res.headers["content-type"]).toContain("image/png")
    expect(res.body).toEqual(PNG)
  })

  it("returns 404 for an unknown id", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app).get("/images/0123456789abcdef01234567")
    expect(res.status).toBe(404)
  })
})

describe("DELETE /images/:id", () => {
  it("removes an existing image", async () => {
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue({ id: "abc" }),
    })

    const res = await request(app).delete("/images/abc")
    expect(res.status).toBe(204)
  })

  it("returns 404 when nothing matched", async () => {
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app).delete("/images/0123456789abcdef01234567")
    expect(res.status).toBe(404)
  })
})
