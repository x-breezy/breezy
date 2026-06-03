import type { Request, Response } from "express"
import StorageService from "../services/storage.service"

/** HTTP handlers for streaming binaries to/from a GridFS-backed StorageService. */
class MediaStreamController {
  constructor(private readonly storage: StorageService) {}

  // Arrow fields keep `this` bound when passed as route handlers.

  upload = async (req: Request, res: Response): Promise<void> => {
    const id = await this.storage.upload(req, {
      filename: req.get("x-filename") ?? "upload",
      contentType: req.get("content-type") ?? "application/octet-stream",
      metadata: { ownerId: req.get("x-owner-id") },
    })
    res.status(201).json({ id })
  }

  get = async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id ?? ""
    const file = await this.storage.findById(id)
    if (!file) {
      res.status(404).json({ error: "Not found" })
      return
    }

    const contentType = file.contentType ?? "application/octet-stream"
    res.set("content-type", contentType)
    res.set("accept-ranges", "bytes")

    const range = req.headers.range
    if (range) {
      const [rawStart, rawEnd] = range.replace("bytes=", "").split("-")
      const start = Number.parseInt(rawStart ?? "0", 10)
      const end = rawEnd ? Number.parseInt(rawEnd, 10) : file.length - 1

      if (Number.isNaN(start) || start >= file.length) {
        res.status(416).set("content-range", `bytes */${file.length}`).end()
        return
      }

      res.status(206).set({
        "content-range": `bytes ${start}-${end}/${file.length}`,
        "content-length": end - start + 1,
      })
      // GridFS end offset is exclusive.
      this.storage.openDownload(id, { start, end: end + 1 }).pipe(res)
    } else {
      res.set("content-length", file.length.toString())
      this.storage.openDownload(id).pipe(res)
    }
  }

  delete = async (req: Request, res: Response): Promise<void> => {
    const deleted = await this.storage.delete(req.params.id ?? "")
    res.status(deleted ? 204 : 404).end()
  }
}

export default MediaStreamController
