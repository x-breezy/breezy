import { Schema, model } from "mongoose"
import type { IPost } from "@breezy/types"

const postSchema = new Schema<IPost>(
  {
    content: { type: String, required: true },
    authorId: { type: String, required: true, index: true },
    tags: { type: [String], default: [] },
    mediaIds: { type: [String], default: [] },
  },
  { timestamps: true, collection: "posts" }
)

postSchema.index({ createdAt: -1 })

export const PostModel = model<IPost>("Post", postSchema)
