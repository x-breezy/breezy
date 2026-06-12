import NotificationService from "../services/notification.service"
import { getActorProfile } from "../config/grpc.client"
import type { SocialFollowEvent } from "../types/events"

const notificationService = new NotificationService()

export async function handleFollow(payload: unknown): Promise<void> {
  const event = payload as SocialFollowEvent
  const profile = await getActorProfile(event.followerId)
  await notificationService.create({
    userId: event.followingId,
    type: "follow",
    payload: {
      actorId: event.followerId,
      username: profile?.username,
      avatarId: profile?.avatarId,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
    },
  })
}
