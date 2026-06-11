"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useNotificationStore } from "@/stores/notification-store"
import type { Notification } from "@/types/notification"

function getActorId(notification: Notification): string {
  return notification.payload.actorId ?? notification.payload.followerId ?? "Someone"
}

function getNotificationMessage(notification: Notification): string {
  const actorId = getActorId(notification)
  switch (notification.type) {
    case "follow":
      return `@${actorId} started following you`
    case "like":
      return `@${actorId} liked your post`
    case "mention":
      return `@${actorId} mentioned you in a post`
  }
}

export function NotificationToast() {
  const notifications = useNotificationStore((s) => s.notifications)
  const prevLen = useRef(0)
  const ready = useRef(false)

  useEffect(() => {
    if (!ready.current) {
      ready.current = true
      prevLen.current = notifications.length
      return
    }

    if (notifications.length > prevLen.current) {
      const latest = notifications[0]
      if (latest) {
        toast(getNotificationMessage(latest))
      }
    }

    prevLen.current = notifications.length
  }, [notifications])

  return null
}
