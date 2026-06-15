"use client"

import { useEffect, useRef, useState } from "react"
import { NotificationsHeader } from "@/components/notifications/notifications-header"
import { NotificationCard } from "@/components/notifications/notification"
import { useNotificationStore } from "@/stores/notification-store"
import {
  groupNotifications,
  groupByTimeFrame,
  type NotificationView,
} from "@/lib/notifications/group"

function viewKey(view: NotificationView): string {
  if (view.kind === "like") return `like-${view.postId}`
  return view.ids[0] as string
}

export default function NotificationsPage() {
  const notifications = useNotificationStore((s) => s.notifications)
  const loading = useNotificationStore((s) => s.loading)
  const error = useNotificationStore((s) => s.error)
  const markAllRead = useNotificationStore((s) => s.markAllRead)
  const remove = useNotificationStore((s) => s.remove)

  const hasMarkedRef = useRef(false)
  const [seenKeys, setSeenKeys] = useState<Set<string>>(new Set())

  const views = groupNotifications(notifications)

  useEffect(() => {
    if (views.length > 0 && !hasMarkedRef.current) {
      hasMarkedRef.current = true
      setSeenKeys(new Set(views.filter((v) => !v.read).map(viewKey)))
      markAllRead()
    }
  }, [views, markAllRead])

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

  if (views.length === 0) {
    return (
      <div>
        <NotificationsHeader />
        <div className='flex items-center justify-center py-12 text-sm text-muted-foreground'>
          No notifications yet
        </div>
      </div>
    )
  }

  const groups = groupByTimeFrame(views)

  return (
    <div>
      <NotificationsHeader />
      <ul className='container-center px-6'>
        {groups.map(({ label, views: groupViews }) => (
          <li key={label}>
            <div className='mb-2 border-b pb-1'>
              <h2 className='text-xl font-bold'>{label}</h2>
            </div>
            <ul>
              {groupViews.map((view) => {
                const key = viewKey(view)
                return (
                  <li key={key}>
                    <NotificationCard
                      view={view}
                      onDismiss={() => view.ids.forEach(remove)}
                      highlight={seenKeys.has(key)}
                    />
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
