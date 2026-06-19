import { Schema, model } from "mongoose"
import { Post } from "../types/post"

const postSchema = new Schema<Post>(
  {
    content: { type: String, required: true },
    authorId: { type: String, required: true },
    tags: { type: [String], default: [] },
    mentions: { type: [String], default: [] },
    media: {
      type: [
        {
          id: { type: String, required: true },
          type: { type: String, enum: ["image", "video"], required: true },
        },
      ],
      default: [],
    },
    parentId: { type: String, index: true, default: null },
    rootParentId: { type: String, index: true, default: null },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "posts" }
)

postSchema.index({ createdAt: -1 })
postSchema.index({ authorId: 1, createdAt: -1 })
postSchema.index({ content: "text", tags: "text" })
postSchema.index({ tags: 1 })

export const PostModel = model("Post", postSchema)
