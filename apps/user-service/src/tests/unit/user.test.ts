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
    it("persists optimized bytes and recomputes size", async () => {
      const data = Buffer.from("imagebytes")
      const created = { id: "abc", size: OPTIMIZED.length, mimeType: "image/png" }
      ;(mockedModel.create as jest.Mock).mockResolvedValue(created)

      const result = await service.uploadImage({
        data,
        originalName: "test.png",
        mimeType: "image/png",
        size: 0,
      })

      expect(mockedModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: OPTIMIZED, size: OPTIMIZED.length, mimeType: "image/png" })
      )
      expect(result).toBe(created)
    })
  })

  describe("getImage", () => {
    it("returns the document by id", async () => {
      const doc = { id: "abc" }
      ;(mockedModel.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      })

      expect(await service.getImage("abc")).toBe(doc)
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
