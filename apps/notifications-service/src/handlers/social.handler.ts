import NotificationService from "../services/notification.service"
import type { SocialFollowEvent } from "../types/events"

const notificationService = new NotificationService()

export async function handleFollow(payload: unknown): Promise<void> {
  const event = payload as SocialFollowEvent
  await notificationService.create({
    userId: event.followingId,
    type: "follow",
    payload: {
      actorId: event.followerId,
      username: event.username,
      avatarId: event.avatarId,
    },
  })
}
