import { IImage } from "@breezy/types"
import { Schema, model } from "mongoose"

/** Mongoose schema for the Image model. */
export const imageSchema = new Schema<IImage>(
  {
    data: { type: Buffer, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    /** Size in bytes. */
    size: { type: Number, required: true, min: 0 },
    /** Pixel dimensions, when known. */
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    alt: { type: String },
    /** Owner / uploader reference  */
    ownerId: { type: String, index: true },
  },
  { timestamps: true, collection: "images" }
)

export const ImageModel = model("Image", imageSchema)
