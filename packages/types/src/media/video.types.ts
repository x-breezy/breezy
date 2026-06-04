export interface IVideo {
  id: string
  /** GridFS file _id holding the raw bytes. */
  gridFsId: string
  originalName: string
  mimeType: string
  size: number
  /** Duration in seconds, populated when probed (e.g. via ffprobe). */
  duration?: number
  width?: number
  height?: number
  title?: string
  ownerId?: string
  createdAt: Date
  updatedAt: Date
}

export interface VideoUploadDTO {
  gridFsId: string
  originalName: string
  mimeType: string
  size: number
  duration?: number
  width?: number
  height?: number
  title?: string
  ownerId?: string
}
