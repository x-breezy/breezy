import request from "supertest"
import { Readable } from "node:stream"
import { createApp } from "../../app"
import { VideoModel } from "../../models/video.model"
import StorageService from "../../services/storage.service"

jest.mock("../../models/video.model", () => ({
  VideoModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    find: jest.fn(),
  },
}))

jest.mock("../../services/storage.service")

const mockedModel = VideoModel as jest.Mocked<typeof VideoModel>
const MockedStorage = StorageService as jest.MockedClass<typeof StorageService>

const VIDEO_BYTES = Buffer.from("fakevideobytes")
const GRID_FS_ID = "64f1a2b3c4d5e6f7a8b9c0d1"
const META_ID = "64f1a2b3c4d5e6f7a8b9c0d2"
const NOW = new Date("2026-01-01T00:00:00.000Z")

const MOCK_META = {
  id: META_ID,
  gridFsId: GRID_FS_ID,
  originalName: "clip.mp4",
  mimeType: "video/mp4",
  size: VIDEO_BYTES.length,
  ownerId: "user-1",
  createdAt: NOW,
  updatedAt: NOW,
}

const MOCK_GRIDFS_FILE = {
  length: VIDEO_BYTES.length,
  contentType: "video/mp4",
}

// createApp() triggers new VideoService() → new StorageService("videos").
// Capture the instance immediately so clearAllMocks() can't lose the reference.
const app = createApp()
const storageInstance = MockedStorage.mock.instances[0] as jest.Mocked<StorageService>

beforeEach(() => {
  jest.clearAllMocks()
  storageInstance.upload = jest.fn().mockResolvedValue(GRID_FS_ID)
  storageInstance.findById = jest.fn().mockResolvedValue(MOCK_GRIDFS_FILE)
  storageInstance.openDownload = jest.fn().mockReturnValue(Readable.from(VIDEO_BYTES))
  storageInstance.delete = jest.fn().mockResolvedValue(true)
})

describe("POST /videos", () => {
  it("uploads a video and returns metadata", async () => {
    ;(mockedModel.create as jest.Mock).mockResolvedValue(MOCK_META)

    const res = await request(app)
      .post("/videos")
      .set("content-type", "video/mp4")
      .set("x-filename", "clip.mp4")
      .set("x-owner-id", "user-1")
      .send(VIDEO_BYTES)

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({ id: META_ID, gridFsId: GRID_FS_ID, mimeType: "video/mp4" }),
    })
  })

  it("rejects missing content-type with 400", async () => {
    const res = await request(app).post("/videos").set("content-type", "").send(VIDEO_BYTES)

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})

describe("GET /videos/:id (stream)", () => {
  it("streams full video bytes", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_META),
    })

    const res = await request(app).get(`/videos/${META_ID}`).responseType("blob")

    expect(res.status).toBe(200)
    expect(res.headers["content-type"]).toContain("video/mp4")
    expect(res.headers["accept-ranges"]).toBe("bytes")
    expect(Buffer.from(res.body).equals(VIDEO_BYTES)).toBe(true)
  })

  it("returns 206 with content-range for a range request", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_META),
    })
    // content-length for bytes=0-3 is 4; mock must return exactly 4 bytes
    // or the HTTP parser throws "Data after Connection: close".
    storageInstance.openDownload = jest.fn().mockReturnValue(
      Readable.from(VIDEO_BYTES.subarray(0, 4))
    )

    const res = await request(app)
      .get(`/videos/${META_ID}`)
      .set("Range", "bytes=0-3")
      .responseType("blob")

    expect(res.status).toBe(206)
    expect(res.headers["content-range"]).toMatch(/^bytes 0-3\//)
  })

  it("returns 416 for out-of-bounds range", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_META),
    })

    const res = await request(app)
      .get(`/videos/${META_ID}`)
      .set("Range", `bytes=${VIDEO_BYTES.length + 100}-`)

    expect(res.status).toBe(416)
    expect(res.headers["content-range"]).toMatch(/\*\//)
  })

  it("returns 404 when meta not found", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app).get(`/videos/${META_ID}`)
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it("returns 404 when GridFS file missing", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_META),
    })
    storageInstance.findById = jest.fn().mockResolvedValue(null)

    const res = await request(app).get(`/videos/${META_ID}`)
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

describe("GET /videos/:id/meta", () => {
  it("returns metadata JSON", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_META),
    })

    const res = await request(app).get(`/videos/${META_ID}/meta`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({ id: META_ID, mimeType: "video/mp4" }),
    })
  })

  it("returns 404 for unknown id", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app).get(`/videos/${META_ID}/meta`)
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

describe("GET /videos (list)", () => {
  it("returns all videos", async () => {
    ;(mockedModel.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([MOCK_META]),
      }),
    })

    const res = await request(app).get("/videos")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.arrayContaining([expect.objectContaining({ id: META_ID })]),
    })
  })

  it("filters by ownerId query param", async () => {
    ;(mockedModel.find as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([MOCK_META]),
      }),
    })

    await request(app).get("/videos?ownerId=user-1")

    expect(mockedModel.find).toHaveBeenCalledWith({ ownerId: "user-1" })
  })
})

describe("DELETE /videos/:id", () => {
  it("removes video and returns success", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_META),
    })
    ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(MOCK_META),
    })

    const res = await request(app).delete(`/videos/${META_ID}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true, data: null })
    expect(storageInstance.delete).toHaveBeenCalledWith(GRID_FS_ID)
  })

  it("returns 404 when meta doc not found", async () => {
    ;(mockedModel.findById as jest.Mock).mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    })

    const res = await request(app).delete(`/videos/${META_ID}`)
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})
