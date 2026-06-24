import { pushService } from "../services/push.service"
import type { MessageSentEvent } from "../types/events"

export async function handleMessageSent(payload: unknown): Promise<void> {
  const event = payload as MessageSentEvent
  await pushService.send(event.recipientUserId, "message", {
    senderUsername: event.senderUsername,
    content: event.content,
    conversationId: event.conversationId,
    senderId: event.senderId,
  })
}
