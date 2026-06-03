export interface ImageDto {
  id: string
  originalName: string
  mimeType: string
  /** Size in bytes. */
  size: number
  width?: number
  height?: number
  alt?: string
  ownerId?: string
  /** ISO-8601 timestamps. */
  createdAt: string
  updatedAt: string
}

export interface CreateImageRequest {
  originalName: string
  mimeType: string
  alt?: string
  ownerId?: string
}
