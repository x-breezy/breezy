import NotificationService from "../services/notification.service"
import { getActorProfile } from "../config/grpc.client"
import type { ContentLikeEvent, ContentMentionEvent } from "../types/events"

const notificationService = new NotificationService()

export async function handleLike(payload: unknown): Promise<void> {
  const event = payload as ContentLikeEvent
  const profile = await getActorProfile(event.actorId)
  await notificationService.create({
    userId: event.targetUserId,
    type: "like",
    payload: {
      actorId: event.actorId,
      postId: event.postId,
      username: profile?.username,
      avatarId: profile?.avatarId,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
    },
  })
}

export async function handleMention(payload: unknown): Promise<void> {
  const event = payload as ContentMentionEvent
  const profile = await getActorProfile(event.actorId)
  await notificationService.create({
    userId: event.targetUserId,
    type: "mention",
    payload: {
      actorId: event.actorId,
      postId: event.postId,
      commentId: event.commentId,
      username: profile?.username,
      avatarId: profile?.avatarId,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
    },
  })
}
