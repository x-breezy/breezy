"use server"

import { getServerAuthHeader } from "@/lib/auth/session"

const API_URL = process.env.API_URL ?? "http://localhost"

export async function suspendUser(userId: string): Promise<void> {
  const authHeader = await getServerAuthHeader()
  const res = await fetch(`${API_URL}/api/users/${userId}/suspend`, {
    method: "PATCH",
    headers: authHeader,
  })
  if (!res.ok) throw new Error(`Failed to suspend user: ${res.status}`)
}

export async function banUser(userId: string): Promise<void> {
  const authHeader = await getServerAuthHeader()
  const res = await fetch(`${API_URL}/api/users/${userId}/ban`, {
    method: "PATCH",
    headers: authHeader,
  })
  if (!res.ok) throw new Error(`Failed to ban user: ${res.status}`)
}

export async function unsuspendUser(userId: string): Promise<void> {
  const authHeader = await getServerAuthHeader()
  const res = await fetch(`${API_URL}/api/users/${userId}/unsuspend`, {
    method: "PATCH",
    headers: authHeader,
  })
  if (!res.ok) throw new Error(`Failed to unsuspend user: ${res.status}`)
}

export async function unbanUser(userId: string): Promise<void> {
  const authHeader = await getServerAuthHeader()
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
  isSuspended: boolean
  isBanned: boolean
  updatedAt: string
}

export interface SanctionedList {
  users: SanctionedUser[]
  total: number
  page: number
  limit: number
}

export async function listSanctionedUsers(
  page = 1,
  limit = 20,
  filter: "suspended" | "banned" | "all" = "all"
): Promise<SanctionedList> {
  const authHeader = await getServerAuthHeader()
  const params = new URLSearchParams({ filter, page: String(page), limit: String(limit) })
  const res = await fetch(`${API_URL}/api/users/sanctioned?${params}`, { headers: authHeader })
  if (!res.ok) throw new Error(`Failed to list sanctioned users: ${res.status}`)
  const json = await res.json()
  return json.data as SanctionedList
}
