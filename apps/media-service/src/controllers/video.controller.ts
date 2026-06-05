import type { Request, Response, NextFunction } from "express"
import VideoService from "../services/video.service"
import { uploadHeadersSchema } from "../schema/video.schema"

class VideoController {
  constructor(private readonly videoService: VideoService) {}

  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const headers = uploadHeadersSchema.safeParse(req.headers)
      if (!headers.success) {
        res.status(400).json({
          success: false,
          message: "Missing or invalid headers: content-type, x-filename, and x-title are required",
        })
        return
      }

      const video = await this.videoService.upload(req, {
        filename: headers.data["x-filename"],
        contentType: headers.data["content-type"],
        ownerId: req.user.id,
        title: headers.data["x-title"],
      })

      res.status(201).json({ success: true, data: video, message: "Video uploaded successfully" })
    } catch (err) {
      next(err)
    }
  }

  /**
   * Stream the raw video bytes with HTTP range support.
   * Sends raw bytes (not ApiResponse) — same pattern as image GET.
   */
  getStream = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const meta = await this.videoService.getMeta(req.params.id)
      if (!meta) {
        res.status(404).json({ success: false, message: "Video not found" })
        return
      }

      const file = await this.videoService.getGridFsFile(meta.gridFsId)
      if (!file) {
        res.status(404).json({ success: false, message: "Video file not found" })
        return
      }

      res.set("content-type", file.contentType!)
      res.set("accept-ranges", "bytes")

      const range = req.headers.range
      if (range) {
        const [rawStart, rawEnd] = range.replace("bytes=", "").split("-")
        const start = Number.parseInt(rawStart ?? "", 10)
        const end = rawEnd ? Number.parseInt(rawEnd, 10) : file.length - 1

        if (Number.isNaN(start) || start >= file.length) {
          res.status(416).set("content-range", `bytes */${file.length}`).end()
          return
        }

        res.status(206).set({
          "content-range": `bytes ${start}-${end}/${file.length}`,
          "content-length": String(end - start + 1),
        })
        // GridFS end offset is exclusive.
        this.videoService.openStream(meta.gridFsId, { start, end: end + 1 }).pipe(res)
      } else {
        res.set("content-length", String(file.length))
        this.videoService.openStream(meta.gridFsId).pipe(res)
      }
    } catch (err) {
      next(err)
    }
  }

  getMeta = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const video = await this.videoService.getMeta(req.params.id)
      if (!video) {
        res.status(404).json({ success: false, message: "Video not found" })
        return
      }

      res
        .status(200)
        .json({ success: true, data: video, message: "Video metadata retrieved successfully" })
    } catch (err) {
      next(err)
    }
  }

  delete = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deleted = await this.videoService.delete(req.params.id)
      if (!deleted) {
        res.status(404).json({ success: false, message: "Video not found" })
        return
      }

      res.status(200).json({ success: true, message: "Video deleted successfully" })
    } catch (err) {
      next(err)
    }
  }
}

export default VideoController
