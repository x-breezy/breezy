"use server"

import { createConversation } from "@/lib/actions/conversations"
import { sendMessage } from "@/lib/actions/messages"

export async function shareToProfile(recipientId: string, postUrl: string): Promise<string> {
  const conv = await createConversation([recipientId])
  await sendMessage(conv._id, postUrl)
  return conv._id
}

export async function shareToConversation(conversationId: string, postUrl: string): Promise<void> {
  await sendMessage(conversationId, postUrl)
}
