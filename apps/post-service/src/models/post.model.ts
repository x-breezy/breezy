import { Schema, model } from "mongoose"
import { Post } from "../types/post"

const postSchema = new Schema<Post>(
  {
    content: { type: String, required: true },
    authorId: { type: String, required: true, index: true },
    tags: { type: [String], default: [] },
    mediaIds: { type: [String], default: [] },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "posts" }
)

postSchema.index({ createdAt: -1 })

export const PostModel = model("Post", postSchema)
