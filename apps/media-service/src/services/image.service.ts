import type { IImage, ImageUploadDTO } from "@breezy/types"
import sharp from "sharp"
import { ImageModel } from "../models/image.model"

class ImageService {
  private async optimizeImage(image: Buffer): Promise<Buffer> {
    return sharp(image)
      .resize(2000, 2000, { fit: "inside" })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer()
  }

  async uploadImage(input: ImageUploadDTO): Promise<IImage> {
    const data = await this.optimizeImage(input.data)
    return ImageModel.create({ ...input, data, size: data.length })
  }

  async getImage(id: string): Promise<IImage | null> {
    return ImageModel.findById(id).exec()
  }

  async deleteImage(id: string): Promise<boolean> {
    const res = await ImageModel.findByIdAndDelete(id).exec()
    return res !== null
  }
}

export default ImageService
