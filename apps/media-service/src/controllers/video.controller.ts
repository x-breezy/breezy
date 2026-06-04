import type { Request, Response } from "express"
import type { ApiResponse, IVideo } from "@breezy/types"
import VideoService from "../services/video.service"
import { uploadHeadersSchema } from "../validators/video.validator"

class VideoController {
  constructor(private readonly videoService: VideoService) {}

  // Arrow fields keep `this` bound when passed as route handlers.

  upload = async (req: Request, res: Response<ApiResponse<IVideo>>): Promise<void> => {
    const headers = uploadHeadersSchema.safeParse(req.headers)
    if (!headers.success) {
      res.status(400).json({ success: false, error: headers.error.issues[0]?.message ?? "Invalid request headers" })
      return
    }

    const video = await this.videoService.upload(req, {
      filename: headers.data["x-filename"],
      contentType: headers.data["content-type"],
      ownerId: headers.data["x-owner-id"],
      title: headers.data["x-title"],
    })

    res.status(201).json({ success: true, data: video })
  }

  /**
   * Stream the raw video bytes with HTTP range support.
   * Sends raw bytes (not ApiResponse) — same pattern as image GET.
   */
  getStream = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
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
  }

  getMeta = async (req: Request<{ id: string }>, res: Response<ApiResponse<IVideo>>): Promise<void> => {
    const video = await this.videoService.getMeta(req.params.id)
    if (!video) {
      res.status(404).json({ success: false, error: "Not found" })
      return
    }

    res.status(200).json({ success: true, data: video })
  }

  list = async (req: Request, res: Response<ApiResponse<IVideo[]>>): Promise<void> => {
    const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId : undefined
    const videos = await this.videoService.list(ownerId)
    res.status(200).json({ success: true, data: videos })
  }

  delete = async (req: Request<{ id: string }>, res: Response<ApiResponse<null>>): Promise<void> => {
    const deleted = await this.videoService.delete(req.params.id)
    if (!deleted) {
      res.status(404).json({ success: false, error: "Not found" })
      return
    }

    res.status(200).json({ success: true, data: null })
  }
}

export default VideoController
