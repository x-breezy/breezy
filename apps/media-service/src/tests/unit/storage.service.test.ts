/* eslint-disable @typescript-eslint/no-explicit-any */
import StorageService from "../../services/storage.service"
import { getBucket, toObjectId } from "../../config/gridfs"
import { Readable, PassThrough } from "node:stream"

jest.mock("../../config/gridfs")

const mockedGetBucket = getBucket as jest.MockedFunction<typeof getBucket>
const mockedToObjectId = toObjectId as jest.MockedFunction<typeof toObjectId>

// toObjectId auto-mock returns undefined by default; give it a stable value
// so openDownloadStream receives a non-undefined first argument.
beforeAll(() => {
  mockedToObjectId.mockReturnValue("mocked-oid" as any)
})

function makeBucket(overrides: Record<string, jest.Mock> = {}) {
  const uploadStream = new PassThrough()
  ;(uploadStream as any).id = { toString: () => "gridfs-id-123" }

  return {
    openUploadStream: jest.fn().mockReturnValue(uploadStream),
    find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
    openDownloadStream: jest.fn().mockReturnValue(Readable.from(Buffer.from("bytes"))),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe("StorageService", () => {
  let service: StorageService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new StorageService("videos")
  })

  describe("upload", () => {
    it("pipes source into GridFS and resolves with file id", async () => {
      const bucket = makeBucket()
      mockedGetBucket.mockReturnValue(bucket as any)

      const source = Readable.from(Buffer.from("video"))
      const idPromise = service.upload(source, { filename: "clip.mp4", contentType: "video/mp4" })

      // Emit finish on the upload stream to resolve the promise.
      bucket.openUploadStream.mock.results[0].value.emit("finish")

      expect(await idPromise).toBe("gridfs-id-123")
      expect(bucket.openUploadStream).toHaveBeenCalledWith(
        "clip.mp4",
        expect.objectContaining({ contentType: "video/mp4" })
      )
    })

    it("rejects on stream error", async () => {
      const bucket = makeBucket()
      mockedGetBucket.mockReturnValue(bucket as any)

      const source = Readable.from(Buffer.from("video"))
      const idPromise = service.upload(source, { filename: "clip.mp4", contentType: "video/mp4" })

      bucket.openUploadStream.mock.results[0].value.emit("error", new Error("write failed"))

      await expect(idPromise).rejects.toThrow("write failed")
    })
  })

  describe("findById", () => {
    it("returns the first matching GridFS file", async () => {
      const mockFile = { _id: "id", length: 100, contentType: "video/mp4" }
      const bucket = makeBucket({
        find: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([mockFile]) }),
      })
      mockedGetBucket.mockReturnValue(bucket as any)

      expect(await service.findById("64f1a2b3c4d5e6f7a8b9c0d1")).toBe(mockFile)
    })

    it("returns null when no file found", async () => {
      const bucket = makeBucket()
      mockedGetBucket.mockReturnValue(bucket as any)

      expect(await service.findById("64f1a2b3c4d5e6f7a8b9c0d1")).toBeNull()
    })

    it("returns null on malformed ObjectId", async () => {
      const bucket = makeBucket({
        find: jest
          .fn()
          .mockReturnValue({ toArray: jest.fn().mockRejectedValue(new Error("bad id")) }),
      })
      mockedGetBucket.mockReturnValue(bucket as any)

      expect(await service.findById("not-an-object-id")).toBeNull()
    })
  })

  describe("openDownload", () => {
    it("opens a download stream without range", () => {
      const stream = Readable.from(Buffer.from("bytes"))
      const bucket = makeBucket({ openDownloadStream: jest.fn().mockReturnValue(stream) })
      mockedGetBucket.mockReturnValue(bucket as any)

      const result = service.openDownload("64f1a2b3c4d5e6f7a8b9c0d1")

      expect(result).toBe(stream)
      expect(bucket.openDownloadStream).toHaveBeenCalledWith(expect.anything(), undefined)
    })

    it("passes range to GridFS", () => {
      const bucket = makeBucket()
      mockedGetBucket.mockReturnValue(bucket as any)

      service.openDownload("64f1a2b3c4d5e6f7a8b9c0d1", { start: 0, end: 10 })

      expect(bucket.openDownloadStream).toHaveBeenCalledWith(expect.anything(), {
        start: 0,
        end: 10,
      })
    })
  })

  describe("delete", () => {
    it("returns true on successful delete", async () => {
      const bucket = makeBucket()
      mockedGetBucket.mockReturnValue(bucket as any)

      expect(await service.delete("64f1a2b3c4d5e6f7a8b9c0d1")).toBe(true)
    })

    it("returns false when delete throws (not found or malformed id)", async () => {
      const bucket = makeBucket({ delete: jest.fn().mockRejectedValue(new Error("not found")) })
      mockedGetBucket.mockReturnValue(bucket as any)

      expect(await service.delete("bad-id")).toBe(false)
    })
  })
})
