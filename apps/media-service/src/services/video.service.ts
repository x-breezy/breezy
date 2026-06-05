import type { Readable } from "node:stream"
import StorageService from "./storage.service"
import { VideoModel } from "../models/video.model"
import { Video } from "../types/video"

export interface VideoUploadHeaders {
  filename: string
  contentType: string
  ownerId?: string
  title?: string
}

class VideoService {
  constructor(private readonly storage: StorageService = new StorageService("videos")) {}

  async upload(source: Readable, headers: VideoUploadHeaders): Promise<Video> {
    const gridFsId = await this.storage.upload(source, {
      filename: headers.filename,
      contentType: headers.contentType,
      metadata: { ownerId: headers.ownerId, title: headers.title },
    })

    // Read the final size back from GridFS (more accurate than content-length header).
    const file = await this.storage.findById(gridFsId)

    return VideoModel.create({
      gridFsId,
      originalName: headers.filename,
      mimeType: headers.contentType,
      size: file?.length ?? 0,
      title: headers.title,
      ownerId: headers.ownerId,
    })
  }

  async getMeta(id: string): Promise<Video | null> {
    return VideoModel.findById(id).exec()
  }

  async list(ownerId?: string): Promise<Video[]> {
    const filter = ownerId ? { ownerId } : {}
    return VideoModel.find(filter).select("-__v").exec()
  }

  /** Open a GridFS download stream for the stored bytes. */
  openStream(gridFsId: string, range?: { start: number; end: number }): Readable {
    return this.storage.openDownload(gridFsId, range)
  }

  /** GridFS file metadata (length, contentType) for a stored file. */
  async getGridFsFile(gridFsId: string) {
    return this.storage.findById(gridFsId)
  }

  async delete(id: string): Promise<boolean> {
    const meta = await VideoModel.findById(id).exec()
    if (!meta) return false

    await this.storage.delete(meta.gridFsId)
    await VideoModel.findByIdAndDelete(id).exec()
    return true
  }
}

export default VideoService
