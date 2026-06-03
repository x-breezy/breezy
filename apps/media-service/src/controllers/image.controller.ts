import type { Request, Response } from "express"
import { toImageDto } from "../mappers/image.mapper"
import ImageService from "../services/image.service"

class ImageController {
  private imageService: ImageService

  constructor(imageService: ImageService) {
    this.imageService = imageService
  }

  uploadImage = async (req: Request, res: Response): Promise<void> => {
    const data = req.body as Buffer
    if (!Buffer.isBuffer(data) || data.length === 0) {
      res.status(400).json({ error: "Empty body" })
      return
    }

    const mimeType = req.get("content-type") ?? "application/octet-stream"
    const originalName = req.get("x-filename") ?? "upload"
    const ownerId = req.get("x-owner-id") ?? undefined

    const image = await this.imageService.uploadImage({
      data,
      mimeType,
      originalName,
      size: data.length,
      ownerId,
    })

    res.status(201).json(toImageDto(image))
  }

  getImage = async (req: Request, res: Response): Promise<void> => {
    const image = await this.imageService.getImage(req.params.id ?? "")
    if (!image) {
      res.status(404).json({ error: "Not found" })
      return
    }

    res.set("content-type", image.mimeType)
    res.send(image.data)
  }

  deleteImage = async (req: Request, res: Response): Promise<void> => {
    const deleted = await this.imageService.deleteImage(req.params.id ?? "")
    res.status(deleted ? 204 : 404).end()
  }
}

export default ImageController
