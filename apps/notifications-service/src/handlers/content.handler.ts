import NotificationService from "../services/notification.service"
import type { ContentLikeEvent, ContentMentionEvent, ContentCommentEvent } from "../types/events"

const notificationService = new NotificationService()

export async function handleLike(payload: unknown): Promise<void> {
  const event = payload as ContentLikeEvent
  await notificationService.create({
    userId: event.targetUserId,
    type: "like",
    payload: {
      actorId: event.actorId,
      postId: event.postId,
      username: event.username,
      avatarId: event.avatarId,
    },
  })
}

export async function handleMention(payload: unknown): Promise<void> {
  const event = payload as ContentMentionEvent
  await notificationService.create({
    userId: event.targetUserId,
    type: "mention",
    payload: {
      actorId: event.actorId,
      postId: event.postId,
      commentId: event.commentId,
      username: event.username,
      avatarId: event.avatarId,
    },
  })
}

export async function handleComment(payload: unknown): Promise<void> {
  const event = payload as ContentCommentEvent
  await notificationService.create({
    userId: event.targetUserId,
    type: "comment",
    payload: {
      actorId: event.actorId,
      postId: event.postId,
      commentId: event.commentId,
      username: event.username,
      avatarId: event.avatarId,
    },
  })
}
