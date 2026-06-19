export interface Image {
  id: string
  data: Buffer
  originalName: string
  mimeType: string
  size: number
  width?: number
  height?: number
  alt?: string
  ownerId?: string
  createdAt: Date
  updatedAt: Date
}

/** IImage without the raw bytes, safe to serialize as JSON. */
export type ImageMeta = Omit<Image, "data">

export interface ImageUploadDTO {
  data: Buffer
  originalName: string
  mimeType: string
  size: number
  width?: number
  height?: number
  alt?: string
  ownerId?: string
}
