import type { Request, Response, NextFunction } from "express"
import ImageService from "../services/image.service"
import { uploadHeadersSchema } from "../validators/image.validator"
import { ApiResponse } from "../types/api"
import { ImageMeta } from "../types/image"

class ImageController {
  constructor(private readonly imageService: ImageService) {}

  uploadImage = async (
    req: Request<Record<string, never>, ApiResponse<ImageMeta>, Buffer>,
    res: Response<ApiResponse<ImageMeta>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!(req.body instanceof Buffer) || req.body.length === 0) {
        res.status(400).json({ success: false })
        return
      }
      const data = req.body

      const headers = uploadHeadersSchema.safeParse(req.headers)
      if (!headers.success) {
        res.status(400).json({ success: false })
        return
      }

      const image = await this.imageService.uploadImage({
        data,
        mimeType: headers.data["content-type"],
        originalName: headers.data["x-filename"],
        size: data.length,
        ownerId: req.user.id,
      })

      // Strip bytes from response; clients fetch raw bytes via GET /:id.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data: _bytes, ...meta } = image
      res.status(201).json({ success: true, data: meta })
    } catch (err) {
      next(err)
    }
  }

  /** Stream raw bytes with content-type header (suitable for <img src="...">). */
  getImage = async (
    req: Request<{ id: string }>,
    res: Response<ApiResponse<null> | Buffer>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const image = await this.imageService.getImage(req.params.id)
      if (!image) {
        res.status(404).json({ success: false })
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
    res: Response<ApiResponse<ImageMeta>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const image = await this.imageService.getImage(req.params.id)
      if (!image) {
        res.status(404).json({ success: false })
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data: _bytes, ...meta } = image
      res.status(200).json({ success: true })
    } catch (err) {
      next(err)
    }
  }

  deleteImage = async (
    req: Request<{ id: string }>,
    res: Response<ApiResponse<null>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deleted = await this.imageService.deleteImage(req.params.id)
      if (!deleted) {
        res.status(404).json({ success: false })
        return
      }

      res.status(200).json({ success: true })
    } catch (err) {
      next(err)
    }
  }
}

export default ImageController
