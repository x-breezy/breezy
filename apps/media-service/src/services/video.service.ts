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

    try {
      const doc = await VideoModel.create({
        gridFsId,
        originalName: headers.filename,
        mimeType: headers.contentType,
        size: file?.length ?? 0,
        title: headers.title,
        ownerId: headers.ownerId,
      })
      // Convert to plain object and map _id to id
      const obj = doc.toObject()
      const video: Video = {
        id: obj._id?.toString() || String(obj._id),
        gridFsId: obj.gridFsId,
        originalName: obj.originalName,
        mimeType: obj.mimeType,
        size: obj.size,
        title: obj.title,
        ownerId: obj.ownerId,
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
      }
      return video
    } catch (err) {
      await this.storage.delete(gridFsId)
      throw err
    }
  }

  async getMeta(id: string): Promise<Video | null> {
    const doc = await VideoModel.findById(id).exec()
    if (!doc) return null
    // Convert to plain object and map _id to id
    const obj = doc.toObject()
    const video: Video = {
      id: obj._id?.toString() || String(obj._id),
      gridFsId: obj.gridFsId,
      originalName: obj.originalName,
      mimeType: obj.mimeType,
      size: obj.size,
      title: obj.title,
      ownerId: obj.ownerId,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    }
    return video
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
