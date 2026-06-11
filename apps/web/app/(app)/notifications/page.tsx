"use client"

import { useEffect, useRef } from "react"
import { NotificationsHeader } from "@/components/notifications/notifications-header"
import { NotificationItem } from "@/components/notifications/notification"
import { useNotificationStore } from "@/stores/notification-store"

export default function NotificationsPage() {
  const notifications = useNotificationStore((s) => s.notifications)
  const loading = useNotificationStore((s) => s.loading)
  const error = useNotificationStore((s) => s.error)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const seenRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (notifications.length > 0 && seenRef.current.size === 0) {
      seenRef.current = new Set(notifications.filter((n) => !n.read).map((n) => n._id))
      markAllRead()
    }
  }, [notifications, markAllRead])

  if (loading) {
    return (
      <div>
        <NotificationsHeader />
        <div className='flex items-center justify-center py-12 text-sm text-muted-foreground'>
          Loading...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <NotificationsHeader />
        <div className='flex items-center justify-center py-12 text-sm text-muted-foreground'>
          {error}
        </div>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div>
        <NotificationsHeader />
        <div className='flex items-center justify-center py-12 text-sm text-muted-foreground'>
          No notifications yet
        </div>
      </div>
    )
  }

  return (
    <div>
      <NotificationsHeader />
      <ul>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification._id}
            notification={notification}
            wasNew={seenRef.current.has(notification._id)}
          />
        ))}
      </ul>
    </div>
  )
}
