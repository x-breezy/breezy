import ImageService from "../../services/image.service"
import { ImageModel } from "../../models/image.model"

jest.mock("../../models/image.model", () => ({
  ImageModel: {
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}))

const OPTIMIZED = Buffer.from("optimized")

jest.mock("sharp", () =>
  jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    toFormat: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(OPTIMIZED),
  }))
)

const mockedModel = ImageModel as jest.Mocked<typeof ImageModel>

describe("ImageService", () => {
  let service: ImageService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ImageService()
  })

  describe("optimizeImage", () => {
    it("returns the sharp-processed buffer", async () => {
      const result = await service.optimizeImage(Buffer.from("hello"))
      expect(result).toEqual(OPTIMIZED)
    })
  })

  describe("uploadImage", () => {
    it("persists optimized JPEG bytes and recomputes size", async () => {
      const data = Buffer.from("imagebytes")
      const created = {
        _id: { toString: () => "abc" },
        id: "abc",
        data: OPTIMIZED,
        size: OPTIMIZED.length,
        mimeType: "image/jpeg",
        originalName: "test.png",
        toObject: () => ({
          _id: { toString: () => "abc" },
          data: OPTIMIZED,
          size: OPTIMIZED.length,
          mimeType: "image/jpeg",
          originalName: "test.png",
        }),
      }
      ;(mockedModel.create as jest.Mock).mockResolvedValue(created)

      const result = await service.uploadImage({
        data,
        originalName: "test.png",
        mimeType: "image/png",
        size: 0,
      })

      expect(mockedModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: OPTIMIZED, size: OPTIMIZED.length, mimeType: "image/jpeg" })
      )
      expect(result.id).toBe("abc")
    })
  })

  describe("getImage", () => {
    it("returns the document by id", async () => {
      const doc = {
        _id: { toString: () => "abc" },
        id: "abc",
        data: OPTIMIZED,
        mimeType: "image/jpeg",
        originalName: "test.png",
        size: OPTIMIZED.length,
        toObject: () => ({
          _id: { toString: () => "abc" },
          data: OPTIMIZED,
          mimeType: "image/jpeg",
          originalName: "test.png",
          size: OPTIMIZED.length,
        }),
      }
      ;(mockedModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      })

      const result = await service.getImage("abc")
      expect(result?.id).toBe("abc")
      expect(mockedModel.findById).toHaveBeenCalledWith("abc")
    })
  })

  describe("deleteImage", () => {
    it("returns true when a document was removed", async () => {
      ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: "abc" }),
      })

      expect(await service.deleteImage("abc")).toBe(true)
    })

    it("returns false when nothing matched", async () => {
      ;(mockedModel.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })

      expect(await service.deleteImage("missing")).toBe(false)
    })
  })
})
