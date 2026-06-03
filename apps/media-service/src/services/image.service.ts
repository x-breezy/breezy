import sharp from "sharp"
import { ImageModel } from "../models/image.model"
import type { CreateImageInput, ImageDocument } from "../models/image.model"

class ImageService {
  optimizeImage(image: Buffer): Buffer {
    sharp(image).resize(2000, 2000, { fit: "inside" }).toFormat("jpeg", { quality: 80 })
    return image
  }

  async uploadImage(input: CreateImageInput): Promise<ImageDocument> {
    const data = this.optimizeImage(input.data)
    return ImageModel.create({ ...input, data, size: data.length })
  }

  async getImage(id: string): Promise<ImageDocument | null> {
    return ImageModel.findById(id).exec()
  }

  async deleteImage(id: string): Promise<boolean> {
    const res = await ImageModel.findByIdAndDelete(id).exec()
    return res !== null
  }
}

export default ImageService
