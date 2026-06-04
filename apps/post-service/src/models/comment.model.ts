import { Schema, model } from "mongoose"
import type { Comment } from "../types/comment"

const commentSchema = new Schema<Comment>(
  {
    content: { type: String, required: true, maxlength: 280 },
    authorId: { type: String, required: true, index: true },
    postId: { type: String, required: true, index: true },
    parentCommentId: { type: String, default: null },
  },
  { timestamps: true, collection: "comments" }
)

export const CommentModel = model<Comment>("Comment", commentSchema)
