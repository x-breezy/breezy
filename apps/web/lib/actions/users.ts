"use server"

import { getAuthHeaders } from "@/lib/auth/authenticated-fetch"

const API_URL = process.env.API_URL ?? "http://localhost"

export async function banUser(userId: string): Promise<void> {
  const authHeader = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/users/${userId}/ban`, {
    method: "PATCH",
    headers: authHeader,
  })
  if (!res.ok) throw new Error(`Failed to ban user: ${res.status}`)
}

export async function unbanUser(userId: string): Promise<void> {
  const authHeader = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/users/${userId}/unban`, {
    method: "PATCH",
    headers: authHeader,
  })
  if (!res.ok) throw new Error(`Failed to unban user: ${res.status}`)
}

export interface SanctionedUser {
  id: string
  username: string
  email: string
  role: string
  isBanned: boolean
  updatedAt: string
  avatarUrl?: string | null
}

export interface SanctionedList {
  users: SanctionedUser[]
  total: number
  page: number
  limit: number
}

export async function listSanctionedUsers(
  page = 1,
  limit = 20
): Promise<SanctionedList> {
  const authHeader = await getAuthHeaders()
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  const res = await fetch(`${API_URL}/api/users/sanctioned?${params}`, { headers: authHeader })
  if (!res.ok) throw new Error(`Failed to list sanctioned users: ${res.status}`)
  const json = await res.json()
  return json.data as SanctionedList
}

export async function listAllUsers(
  page = 1,
  limit = 100
): Promise<SanctionedList> {
  const authHeader = await getAuthHeaders()
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  const res = await fetch(`${API_URL}/api/users/?${params}`, { headers: authHeader })
  if (!res.ok) throw new Error(`Failed to list users: ${res.status}`)
  const json = await res.json()
  return json.data as SanctionedList
}

export interface CreateUserPayload {
  username: string
  email: string
  password: string
  role?: "user" | "moderator" | "admin"
}

export async function createUser(payload: CreateUserPayload): Promise<SanctionedUser> {
  const authHeader = await getAuthHeaders()
  const res = await fetch(`${API_URL}/api/users/`, {
    method: "POST",
    headers: { ...authHeader, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as { message?: string } | null
    throw new Error(json?.message ?? `Failed to create user: ${res.status}`)
  }
  const json = (await res.json()) as { data: SanctionedUser }
  return json.data
}
