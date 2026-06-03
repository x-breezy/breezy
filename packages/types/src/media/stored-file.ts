export interface StoredFileDto {
  id: string
  filename: string
  contentType: string
  /** Size in bytes. */
  length: number
  /** ISO-8601 upload time. */
  uploadDate: string
  ownerId?: string
}
