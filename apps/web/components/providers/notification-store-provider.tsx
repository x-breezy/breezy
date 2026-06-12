"use client"

import { useEffect } from "react"
import { useNotificationStore } from "@/stores/notification-store"

interface Props {
  children: React.ReactNode
}

const SSE_URL = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost"}/api/notifications/stream`

export function NotificationStoreProvider({ children }: Props) {
  const list = useNotificationStore((s) => s.list)
  const prepend = useNotificationStore((s) => s.prepend)

  useEffect(() => {
    list()

    const eventSource = new EventSource(SSE_URL, { withCredentials: true })

    eventSource.addEventListener("notification", (event) => {
      try {
        const notification = JSON.parse(event.data)
        prepend(notification)
      } catch {
        // ignore malformed events
      }
    })

    return () => eventSource.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}
