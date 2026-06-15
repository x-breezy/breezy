import type { Request, Response, NextFunction } from "express"
import ImageService from "../services/image.service"
import { uploadHeadersSchema } from "../schema/image.schema"

class ImageController {
  constructor(private readonly imageService: ImageService) { }

  uploadImage = async (
    req: Request<Record<string, never>, null, Buffer>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!(req.body instanceof Buffer) || req.body.length === 0) {
        res
          .status(400)
          .json({ success: false, message: "Request body must be non-empty binary data" })
        return
      }
      const data = req.body

      const headers = uploadHeadersSchema.safeParse(req.headers)
      if (!headers.success) {
        res.status(400).json({
          success: false,
          message: "Missing or invalid headers: content-type and x-filename are required",
        })
        return
      }

      const image = await this.imageService.uploadImage({
        data,
        mimeType: headers.data["content-type"],
        originalName: headers.data["x-filename"],
        size: data.length,
        ownerId: req.user.id,
      })

      // Remove binary data from response
      const { data: _bytes, ...meta } = image
      res.status(201).json({ success: true, data: meta, message: "Image uploaded successfully" })
    } catch (err) {
      next(err)
    }
  }

  /** Stream raw bytes with content-type header (suitable for <img src="...">). */
  getImage = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const image = await this.imageService.getImage(req.params.id)
      if (!image) {
        res.status(404).json({ success: false, message: "Image not found" })
        return
      }

      res.set("content-type", image.mimeType)
      res.send(image.data)
    } catch (err) {
      next(err)
    }
  }

  /** Return metadata as JSON without the raw bytes. */
  getImageMeta = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const image = await this.imageService.getImage(req.params.id)
      if (!image) {
        res.status(404).json({ success: false, message: "Image not found" })
        return
      }

      // Remove binary data from response
      const { data: _bytes, ...meta } = image
      res
        .status(200)
        .json({ success: true, data: meta, message: "Image metadata retrieved successfully" })
    } catch (err) {
      next(err)
    }
  }

  deleteImage = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deleted = await this.imageService.deleteImage(req.params.id)
      if (!deleted) {
        res.status(404).json({ success: false, message: "Image not found" })
        return
      }

      res.status(200).json({ success: true, message: "Image deleted successfully" })
    } catch (err) {
      next(err)
    }
  }
}

export default ImageController
