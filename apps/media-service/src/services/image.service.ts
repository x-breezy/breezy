import sharp from "sharp"
import { ImageModel } from "../models/image.model"
import { ImageUploadDTO, Image } from "../types/image"

class ImageService {
  async optimizeImage(image: Buffer): Promise<Buffer> {
    return sharp(image)
      .resize(2000, 2000, { fit: "inside" })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer()
  }

  async uploadImage(input: ImageUploadDTO): Promise<Image> {
    const data = await this.optimizeImage(input.data)
    return ImageModel.create({ ...input, data, size: data.length })
  }

  async getImage(id: string): Promise<Image | null> {
    return ImageModel.findById(id).exec()
  }

  async deleteImage(id: string): Promise<boolean> {
    const res = await ImageModel.findByIdAndDelete(id).exec()
    return res !== null
  }
}

export default ImageService
