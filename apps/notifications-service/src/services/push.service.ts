import webpush from "web-push"
import { createLogger } from "@breezy/logger"
import type { NotificationType } from "../models/notification.model"
import { PushSubscriptionModel } from "../models/push-subscription.model"

const logger = createLogger({ service: "notifications-service" })

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    VAPID_SUBJECT ?? "mailto:noreply@breezy.app",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

function getNotificationUrl(
  type: NotificationType,
  payload: Record<string, string | undefined>
): string {
  switch (type) {
    case "message":
      return `/messages?conversation=${payload.conversationId ?? ""}`
    default:
      return "/notifications"
  }
}

function formatNotification(
  type: NotificationType,
  payload: Record<string, string | undefined>
): { title: string; body: string } {
  const actor =
    payload.username ??
    payload.actorUsername ??
    payload.actorDisplayName ??
    payload.actorId ??
    "Someone"
  switch (type) {
    case "follow":
      return { title: "New follower", body: `${actor} started following you` }
    case "like":
      return { title: "New like", body: `${actor} liked your post` }
    case "comment":
      return { title: "New comment", body: `${actor} commented on your post` }
    case "mention":
      return { title: "You were mentioned", body: `${actor} mentioned you` }
    case "reply":
      return { title: "New reply", body: `${actor} replied to your comment` }
    case "message":
      return {
        title: `@${payload.senderUsername ?? "unknown"} sent you a message`,
        body: payload.content ?? "",
      }
  }
}

class PushService {
  get vapidPublicKey(): string | undefined {
    return VAPID_PUBLIC_KEY
  }

  async subscribe(
    userId: string,
    subscription: { endpoint: string; keys: { auth: string; p256dh: string } }
  ): Promise<void> {
    await PushSubscriptionModel.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      { userId, endpoint: subscription.endpoint, keys: subscription.keys },
      { upsert: true }
    )
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await PushSubscriptionModel.deleteOne({ userId, endpoint })
  }

  async send(
    userId: string,
    type: NotificationType,
    payload: Record<string, string | undefined>
  ): Promise<void> {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return

    const subscriptions = await PushSubscriptionModel.find({ userId })
    logger.info({ userId, count: subscriptions.length }, "push: sending to subscriptions")
    if (!subscriptions.length) return

    const notification = formatNotification(type, payload)
    const data = JSON.stringify({
      ...notification,
      type,
      url: getNotificationUrl(type, payload),
    })

    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush
          .sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, data)
          .then(() => logger.info({ endpoint: sub.endpoint.slice(-20) }, "push: sent ok"))
          .catch(async (err: { statusCode?: number; message?: string }) => {
            logger.warn({ statusCode: err.statusCode, message: err.message }, "push: send failed")
            if (err.statusCode === 410 || err.statusCode === 404) {
              await PushSubscriptionModel.deleteOne({ _id: sub._id })
            }
          })
      )
    )
  }
}

export const pushService = new PushService()
