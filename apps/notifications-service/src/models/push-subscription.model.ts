import { Schema, model, type Document } from "mongoose"

export interface IPushSubscription extends Document {
  userId: string
  endpoint: string
  keys: { auth: string; p256dh: string }
}

const schema = new Schema<IPushSubscription>(
  {
    userId: { type: String, required: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      auth: { type: String, required: true },
      p256dh: { type: String, required: true },
    },
  },
  { timestamps: true, collection: "push_subscriptions" }
)

schema.index({ userId: 1 })

export const PushSubscriptionModel = model<IPushSubscription>("PushSubscription", schema)
