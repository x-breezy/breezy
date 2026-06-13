import { Schema, model, type Document } from "mongoose"

export type NotificationType = "follow" | "like" | "mention" | "comment"

export interface INotification extends Document {
  userId: string
  type: NotificationType
  read: boolean
  payload: Record<string, string | undefined>
  createdAt: Date
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true },
    type: { type: String, enum: ["follow", "like", "mention", "comment"], required: true },
    read: { type: Boolean, default: false },
    payload: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true, collection: "notifications" }
)

notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })

export const NotificationModel = model<INotification>("Notification", notificationSchema)
