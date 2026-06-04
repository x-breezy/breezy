import { Schema, model } from "mongoose"
import { Video } from "../types/video"

export const videoSchema = new Schema<Video>(
  {
    /** GridFS file _id (hex string) for the stored bytes. */
    gridFsId: { type: String, required: true, index: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    /** Duration in seconds (optional, requires ffprobe). */
    duration: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    title: { type: String },
    /** Owner / uploader reference (user id from the auth domain). */
    ownerId: { type: String, index: true },
  },
  {
    timestamps: true,
    // Distinct from the GridFS videos.files / videos.chunks collections.
    collection: "videos_meta",
  }
)

export const VideoModel = model("Video", videoSchema)
