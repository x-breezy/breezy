"use server"

import { authenticatedFetch } from "@/lib/auth/authenticated-fetch"

export interface ReplyTo {
  _id: string
  content: string
  senderName: string
}

export interface Message {
  _id: string
  conversationId: string
  senderId: string
  content: string
  isSystem?: boolean
  replyTo?: ReplyTo
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export async function listMessages(
  conversationId: string,
  page = 1,
  limit = 100
): Promise<{ data: Message[]; total: number; page: number; limit: number }> {
  const res = await authenticatedFetch(
    `/api/conversations/${conversationId}/messages?page=${page}&limit=${limit}`
  )
  if (!res.ok) throw new Error(`Failed to load messages: ${res.status}`)
  const json = await res.json()
  return json as { data: Message[]; total: number; page: number; limit: number }
}

export async function sendMessage(
  conversationId: string,
  content: string,
  replyTo?: ReplyTo
): Promise<Message> {
  const res = await authenticatedFetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, replyTo }),
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`)
  const json = await res.json()
  return json.data as Message
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await authenticatedFetch(`/api/conversations/${conversationId}/read`, { method: "PATCH" })
}
