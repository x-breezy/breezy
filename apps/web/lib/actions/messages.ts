"use server"

import { authenticatedFetch } from "@/lib/auth/authenticated-fetch"

export interface Message {
  _id: string
  conversationId: string
  senderId: string
  content: string
  isSystem?: boolean
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export async function listMessages(conversationId: string): Promise<Message[]> {
  const res = await authenticatedFetch(`/api/conversations/${conversationId}/messages`)
  if (!res.ok) throw new Error(`Failed to load messages: ${res.status}`)
  const json = await res.json()
  return json.data as Message[]
}

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  const res = await authenticatedFetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`)
  const json = await res.json()
  return json.data as Message
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await authenticatedFetch(`/api/conversations/${conversationId}/read`, { method: "PATCH" })
}
