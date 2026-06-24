"use server"

import { getServerAuthHeader } from "@/lib/auth/session"
import * as notificationService from "@/lib/services/notification-service"
import type { NotificationListResponse } from "@/types/notification"

export async function listNotifications(page = 1, limit = 20) {
  const authHeader = await getServerAuthHeader()
  const res = await notificationService.listNotifications(authHeader, page, limit)
  return res.data as NotificationListResponse
}

export async function markNotificationRead(id: string) {
  const authHeader = await getServerAuthHeader()
  await notificationService.markNotificationRead(authHeader, id)
}

export async function markAllNotificationsRead() {
  const authHeader = await getServerAuthHeader()
  await notificationService.markAllNotificationsRead(authHeader)
}

export async function deleteNotification(id: string) {
  const authHeader = await getServerAuthHeader()
  await notificationService.deleteNotification(authHeader, id)
}

export async function subscribePush(subscription: {
  endpoint: string
  keys: { auth: string; p256dh: string }
}) {
  const authHeader = await getServerAuthHeader()
  await notificationService.subscribePush(authHeader, subscription)
}
