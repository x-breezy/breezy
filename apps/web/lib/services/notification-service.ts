import type { NotificationListResponse } from "@/types/notification"

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost"

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }))
    throw new Error(body.error ?? "Request failed")
  }

  if (res.status === 204) return undefined as T

  return res.json()
}

export function listNotifications(page = 1, limit = 20, unreadOnly?: boolean) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (unreadOnly !== undefined) params.set("read", String(!unreadOnly))
  return request<NotificationListResponse>(`/api/notifications/?${params}`)
}

export function markNotificationRead(id: string) {
  return request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: "PATCH" })
}

export function markAllNotificationsRead() {
  return request<{ success: boolean }>("/api/notifications/read-all", { method: "PATCH" })
}

export function deleteNotification(id: string) {
  return request<void>(`/api/notifications/${id}`, { method: "DELETE" })
}
