import type { Request, Response, NextFunction } from "express"
import VideoService from "../services/video.service"
import { uploadHeadersSchema } from "../validators/video.validator"
import { ApiResponse } from "../types/api"
import { Video } from "../types/video"

class VideoController {
  constructor(private readonly videoService: VideoService) {}

  list = async (
    req: Request,
    res: Response<ApiResponse<Video[]>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const ownerId = req.query.ownerId as string | undefined
      const videos = await this.videoService.list(ownerId)
      res.json({ success: true, data: videos })
    } catch (err) {
      next(err)
    }
  }

  upload = async (
    req: Request,
    res: Response<ApiResponse<Video>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const headers = uploadHeadersSchema.safeParse(req.headers)
      if (!headers.success) {
        res.status(400).json({
          success: false,
          error: headers.error.issues[0]?.message ?? "Invalid request headers",
        })
        return
      }

      const video = await this.videoService.upload(req, {
        filename: headers.data["x-filename"],
        contentType: headers.data["content-type"],
        ownerId: req.user.id,
        title: headers.data["x-title"],
      })

      res.status(201).json({ success: true, data: video })
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
    res: Response<ApiResponse<null> | void>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const meta = await this.videoService.getMeta(req.params.id)
      if (!meta) {
        res.status(404).json({ success: false, error: "Not found" })
        return
      }

      const file = await this.videoService.getGridFsFile(meta.gridFsId)
      if (!file) {
        res.status(404).json({ success: false, error: "File not found in storage" })
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
    res: Response<ApiResponse<Video>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const video = await this.videoService.getMeta(req.params.id)
      if (!video) {
        res.status(404).json({ success: false, error: "Not found" })
        return
      }

      res.status(200).json({ success: true, data: video })
    } catch (err) {
      next(err)
    }
  }

  delete = async (
    req: Request<{ id: string }>,
    res: Response<ApiResponse<null>>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deleted = await this.videoService.delete(req.params.id)
      if (!deleted) {
        res.status(404).json({ success: false, error: "Not found" })
        return
      }

      res.status(200).json({ success: true })
    } catch (err) {
      next(err)
    }
  }
}

export default VideoController
