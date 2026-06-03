export interface IImage {
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
