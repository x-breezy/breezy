import { Schema, model, models } from "mongoose"
import type { HydratedDocument, InferSchemaType, Model } from "mongoose"

/**
 * Stored image asset. Binary bytes live inline in `data`.
 *
 * NOTE: MongoDB caps a single document at 16MB, so this only fits small/medium
 * images. Exclude `data` from list queries (`.select("-data")`) to avoid
 * loading every blob into memory.
 *
 * Internal persistence shape — not the cross-service contract. Map to
 * `ImageDto` (@breezy/types) at the API boundary.
 */
export const imageSchema = new Schema(
  {
    /** Raw image bytes. */
    data: { type: Buffer, required: true },
    /** Original filename at upload time. */
    originalName: { type: String, required: true },
    /** MIME type, e.g. "image/png". */
    mimeType: { type: String, required: true },
    /** Size in bytes. */
    size: { type: Number, required: true, min: 0 },
    /** Pixel dimensions, when known. */
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    /** Alt text for accessibility. */
    alt: { type: String },
    /** Owner / uploader reference (user id from the auth domain). */
    ownerId: { type: String, index: true },
  },
  { timestamps: true, collection: "images" },
)

export type Image = InferSchemaType<typeof imageSchema>
export type ImageDocument = HydratedDocument<Image>

/** Fields a caller supplies when storing a new image (timestamps are auto). */
export type CreateImageInput = Omit<Image, "createdAt" | "updatedAt">

/** Reuse the compiled model on hot-reload to avoid OverwriteModelError. */
export const ImageModel: Model<Image> =
  (models.Image as Model<Image>) ?? model<Image>("Image", imageSchema)
