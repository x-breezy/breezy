/* eslint-disable @typescript-eslint/no-explicit-any */
import VideoService from "../../services/video.service"
import { VideoModel } from "../../models/video.model"
import StorageService from "../../services/storage.service"
import { Readable } from "node:stream"

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

describe("VideoService", () => {
  let service: VideoService
  let storage: jest.Mocked<StorageService>

  beforeEach(() => {
    jest.clearAllMocks()
    storage = new MockedStorage("videos") as jest.Mocked<StorageService>
    service = new VideoService(storage)
  })

  describe("upload", () => {
    it("streams to GridFS then creates metadata doc", async () => {
      const source = Readable.from(Buffer.from("videobytes"))
      const gridFsId = "gridfs-abc"
      const created = {
        _id: { toString: () => "meta-abc" },
        id: "meta-abc",
        gridFsId,
        size: 10,
        mimeType: "video/mp4",
        originalName: "clip.mp4",
        toObject: () => ({
          _id: { toString: () => "meta-abc" },
          gridFsId,
          size: 10,
          mimeType: "video/mp4",
          originalName: "clip.mp4",
        }),
      }

      storage.upload = jest.fn().mockResolvedValue(gridFsId)
      storage.findById = jest.fn().mockResolvedValue({ length: 10 } as any)
        ; (mockedModel.create as jest.Mock).mockResolvedValue(created)

      const result = await service.upload(source, {
        filename: "clip.mp4",
        contentType: "video/mp4",
        ownerId: "user-1",
      })

      expect(storage.upload).toHaveBeenCalledWith(
        source,
        expect.objectContaining({ filename: "clip.mp4", contentType: "video/mp4" })
      )
      expect(mockedModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          gridFsId,
          originalName: "clip.mp4",
          mimeType: "video/mp4",
          size: 10,
        })
      )
      expect(result.id).toBe("meta-abc")
    })

    it("uses size 0 when GridFS file not found after upload", async () => {
      storage.upload = jest.fn().mockResolvedValue("gfs-id")
      storage.findById = jest.fn().mockResolvedValue(null)
      const created = {
        _id: { toString: () => "meta-id" },
        id: "meta-id",
        toObject: () => ({ _id: { toString: () => "meta-id" } }),
      }
        ; (mockedModel.create as jest.Mock).mockResolvedValue(created)

      await service.upload(Readable.from(Buffer.from("v")), {
        filename: "x.mp4",
        contentType: "video/mp4",
      })

      expect(mockedModel.create).toHaveBeenCalledWith(expect.objectContaining({ size: 0 }))
    })
  })

  describe("getMeta", () => {
    it("returns the document by id", async () => {
      const doc = {
        _id: { toString: () => "meta-abc" },
        id: "meta-abc",
        gridFsId: "gridfs-abc",
        toObject: () => ({
          _id: { toString: () => "meta-abc" },
          gridFsId: "gridfs-abc",
        }),
      }
        ; (mockedModel.findById as jest.Mock).mockReturnValue({
          exec: jest.fn().mockResolvedValue(doc),
        })

      const result = await service.getMeta("meta-abc")
      expect(result?.id).toBe("meta-abc")
    })

    it("returns null for unknown id", async () => {
      ; (mockedModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })

      expect(await service.getMeta("missing")).toBeNull()
    })
  })

  describe("list", () => {
    it("returns all videos when no filter", async () => {
      const docs = [{ id: "a" }, { id: "b" }]
        ; (mockedModel.find as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(docs) }),
        })

      const result = await service.list()
      expect(mockedModel.find).toHaveBeenCalledWith({})
      expect(result).toBe(docs)
    })

    it("filters by ownerId when provided", async () => {
      ; (mockedModel.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
      })

      await service.list("user-1")
      expect(mockedModel.find).toHaveBeenCalledWith({ ownerId: "user-1" })
    })
  })

  describe("openStream", () => {
    it("delegates to storage.openDownload without range", () => {
      const stream = Readable.from(Buffer.from("v"))
      storage.openDownload = jest.fn().mockReturnValue(stream)

      expect(service.openStream("gfs-id")).toBe(stream)
      expect(storage.openDownload).toHaveBeenCalledWith("gfs-id", undefined)
    })

    it("passes range to storage.openDownload", () => {
      const stream = Readable.from(Buffer.from("v"))
      storage.openDownload = jest.fn().mockReturnValue(stream)

      service.openStream("gfs-id", { start: 0, end: 100 })
      expect(storage.openDownload).toHaveBeenCalledWith("gfs-id", { start: 0, end: 100 })
    })
  })

  describe("getGridFsFile", () => {
    it("delegates to storage.findById", async () => {
      const file = { length: 100 } as any
      storage.findById = jest.fn().mockResolvedValue(file)

      expect(await service.getGridFsFile("gfs-id")).toBe(file)
      expect(storage.findById).toHaveBeenCalledWith("gfs-id")
    })
  })

  describe("delete", () => {
    it("removes GridFS bytes and metadata doc", async () => {
      const meta = { id: "meta-abc", gridFsId: "gridfs-abc" }
        ; (mockedModel.findById as jest.Mock).mockReturnValue({
          exec: jest.fn().mockResolvedValue(meta),
        })
      storage.delete = jest.fn().mockResolvedValue(true)
        ; (mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
          exec: jest.fn().mockResolvedValue(meta),
        })

      expect(await service.delete("meta-abc")).toBe(true)
      expect(storage.delete).toHaveBeenCalledWith("gridfs-abc")
      expect(mockedModel.findByIdAndDelete).toHaveBeenCalledWith("meta-abc")
    })

    it("returns false when meta doc not found", async () => {
      ; (mockedModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })

      expect(await service.delete("missing")).toBe(false)
      expect(storage.delete).not.toHaveBeenCalled()
    })
  })
})
