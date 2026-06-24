import serverClient from "@/lib/api/server-client"
import type { NotificationListResponse } from "@/types/notification"

export function listNotifications(authHeader: Record<string, string>, page = 1, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return serverClient.get<NotificationListResponse>(`/api/notifications/?${params}`, {
    headers: authHeader,
  })
}

export function markNotificationRead(authHeader: Record<string, string>, id: string) {
  return serverClient.patch(`/api/notifications/${id}/read`, null, { headers: authHeader })
}

export function markAllNotificationsRead(authHeader: Record<string, string>) {
  return serverClient.patch("/api/notifications/read-all", null, { headers: authHeader })
}

export function deleteNotification(authHeader: Record<string, string>, id: string) {
  return serverClient.delete(`/api/notifications/${id}`, { headers: authHeader })
}

export function subscribePush(
  authHeader: Record<string, string>,
  body: { endpoint: string; keys: { auth: string; p256dh: string } }
) {
  return serverClient.post("/api/notifications/push/subscribe", body, { headers: authHeader })
}
