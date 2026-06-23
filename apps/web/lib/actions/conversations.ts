"use server"

import { authenticatedFetch } from "@/lib/auth/authenticated-fetch"

export interface ConversationMeta {
  _id: string
  participantIds: string[]
  isGroup?: boolean
  name?: string
  lastMessage?: string
  lastMessageSenderId?: string
  lastMessageAt?: string
  hasUnread?: boolean
  unreadCount?: number
}

export async function listConversations(): Promise<ConversationMeta[]> {
  const res = await authenticatedFetch("/api/conversations/")
  if (!res.ok) throw new Error(`Failed to list conversations: ${res.status}`)
  const json = await res.json()
  return json.data as ConversationMeta[]
}

export async function createConversation(
  recipientIds: string[],
  name?: string
): Promise<ConversationMeta> {
  const body: Record<string, unknown> = { recipientIds }
  if (name) body.name = name
  const res = await authenticatedFetch("/api/conversations/", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new Error(
      (json as { message?: string })?.message ?? `Failed to create conversation: ${res.status}`
    )
  }
  const json = await res.json()
  return json.data as ConversationMeta
}

export async function deleteConversation(id: string): Promise<void> {
  const res = await authenticatedFetch(`/api/conversations/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error(`Failed to delete conversation: ${res.status}`)
}

export async function renameConversation(id: string, name: string): Promise<string> {
  const res = await authenticatedFetch(`/api/conversations/${id}/name`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new Error(
      (json as { message?: string })?.message ?? `Failed to rename conversation: ${res.status}`
    )
  }
  const json = await res.json()
  return json.data.name as string
}

export async function addConversationMember(id: string, memberIds: string[]): Promise<void> {
  const res = await authenticatedFetch(`/api/conversations/${id}/members`, {
    method: "POST",
    body: JSON.stringify({ memberIds }),
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) {
    const json = await res.json().catch(() => null)
    throw new Error(
      (json as { message?: string })?.message ?? `Failed to add member: ${res.status}`
    )
  }
}

export async function getUserByUsername(
  username: string
): Promise<{ id: string; username: string }> {
  const res = await authenticatedFetch(`/api/users/by-username/${encodeURIComponent(username)}`)
  if (!res.ok) {
    if (res.status === 404) throw new Error(`User not found: @${username}`)
    throw new Error(`Failed to find user @${username}: ${res.status}`)
  }
  const json = await res.json()
  return json.data as { id: string; username: string }
}

export async function getUserById(id: string): Promise<{ username: string }> {
  const res = await authenticatedFetch(`/api/users/${id}`)
  if (!res.ok) throw new Error(`Failed to get user: ${res.status}`)
  const json = await res.json()
  return { username: json.data.username as string }
}

export async function getProfileById(
  id: string
): Promise<{ firstName: string | null; lastName: string | null; avatarId: string | null }> {
  const res = await authenticatedFetch(`/api/profiles/${id}`)
  if (!res.ok) throw new Error(`Failed to get profile: ${res.status}`)
  const json = await res.json()
  return {
    firstName: (json.data.firstName as string) ?? null,
    lastName: (json.data.lastName as string) ?? null,
    avatarId: (json.data.avatarId as string) ?? null,
  }
}
