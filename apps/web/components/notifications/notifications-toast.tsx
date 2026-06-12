"use client"

import { useEffect } from "react"
import { toast as sonnerToast } from "sonner"
import { useNotificationStore } from "@/stores/notification-store"
import { NotificationCard } from "./notification"
import { groupNotifications } from "@/lib/notifications/group"

export function NotificationToast() {
  const lastNew = useNotificationStore((s) => s.lastNew)
  const remove = useNotificationStore((s) => s.remove)

  useEffect(() => {
    if (!lastNew) return
    const view = groupNotifications([lastNew])[0]
    if (!view) return
    sonnerToast.custom((id) => (
      <NotificationCard
        view={view}
        onDismiss={() => {
          view.ids.forEach(remove)
          sonnerToast.dismiss(id)
        }}
        className='rounded-lg bg-background shadow-lg ring-1 ring-border md:max-w-91 md:min-w-91'
      />
    ))
  }, [lastNew]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
