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
    const isGif = input.mimeType === "image/gif"
    const data = isGif ? input.data : await this.optimizeImage(input.data)
    const mimeType = isGif ? "image/gif" : "image/jpeg"
    const doc = await ImageModel.create({
      ...input,
      data,
      mimeType,
      size: data.length,
    })
    // Convert to plain object and map _id to id
    const obj = doc.toObject()
    const image: Image = {
      id: obj._id?.toString() || String(obj._id),
      data: doc.data as Buffer,
      originalName: obj.originalName,
      mimeType: obj.mimeType,
      size: obj.size,
      width: obj.width,
      height: obj.height,
      alt: obj.alt,
      ownerId: obj.ownerId,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    }
    return image
  }

  async getImage(id: string): Promise<Image | null> {
    const doc = await ImageModel.findById(id).exec()
    if (!doc) return null
    // Convert to plain object and map _id to id
    const obj = doc.toObject()
    const image: Image = {
      id: obj._id?.toString() || String(obj._id),
      data: doc.data as Buffer,
      originalName: obj.originalName,
      mimeType: obj.mimeType,
      size: obj.size,
      width: obj.width,
      height: obj.height,
      alt: obj.alt,
      ownerId: obj.ownerId,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    }
    return image
  }

  async deleteImage(id: string): Promise<boolean> {
    const res = await ImageModel.findByIdAndDelete(id).exec()
    return res !== null
  }
}

export default ImageService
