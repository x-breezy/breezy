import type { GridFSBucket, GridFSFile } from "mongodb"
import type { Readable } from "node:stream"
import { getBucket, toObjectId } from "../config/gridfs"

export interface UploadMeta {
  filename: string
  contentType: string
  metadata?: Record<string, unknown>
}

/** Streaming binary store backed by a GridFS bucket. One instance per bucket. */
class StorageService {
  constructor(private readonly bucketName: string) {}

  private bucket(): GridFSBucket {
    return getBucket(this.bucketName)
  }

  /** Pipe a readable into GridFS. Resolves with the new file id. */
  upload(source: Readable, meta: UploadMeta): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = this.bucket().openUploadStream(meta.filename, {
        contentType: meta.contentType,
        metadata: meta.metadata,
      })
      source
        .pipe(stream)
        .on("error", reject)
        .on("finish", () => resolve(stream.id.toString()))
    })
  }

  /** File metadata (length, contentType, ...), or null if absent/invalid id. */
  async findById(id: string): Promise<GridFSFile | null> {
    try {
      const files = await this.bucket()
        .find({ _id: toObjectId(id) })
        .toArray()
      return files[0] ?? null
    } catch {
      return null // malformed ObjectId
    }
  }

  /** Open a read stream, optionally for a byte range (end is exclusive). */
  openDownload(id: string, range?: { start: number; end: number }): Readable {
    return this.bucket().openDownloadStream(toObjectId(id), range)
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.bucket().delete(toObjectId(id))
      return true
    } catch {
      return false // not found or malformed id
    }
  }
}

export default StorageService
