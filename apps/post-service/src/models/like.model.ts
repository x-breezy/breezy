import { Schema, model } from "mongoose"
import { Like } from "../types/like"

const likeSchema = new Schema<Like>(
  {
    postId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true, collection: "likes" }
)

likeSchema.index({ postId: 1, userId: 1 }, { unique: true })

export const LikeModel = model<Like>("Like", likeSchema)
