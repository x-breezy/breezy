import type { ImageDto } from "@breezy/types"
import type { ImageDocument } from "../models/image.model"

/** Map an internal image document to its cross-service wire shape. */
export function toImageDto(doc: ImageDocument): ImageDto {
  return {
    id: doc.id,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    size: doc.size,
    width: doc.width ?? undefined,
    height: doc.height ?? undefined,
    alt: doc.alt ?? undefined,
    ownerId: doc.ownerId ?? undefined,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }
}
