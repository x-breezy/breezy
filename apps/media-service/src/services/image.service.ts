import { ImageModel } from "@breezy/db"
import type { CreateImageInput, ImageDocument } from "@breezy/db"

class ImageService {
  optimizeImage(image: Buffer): Buffer {
    // TODO: Implement image optimization logic (e.g., resizing, compression)
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
