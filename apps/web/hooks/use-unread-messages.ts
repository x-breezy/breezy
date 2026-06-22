import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useSocket } from "@/hooks/use-socket"
import apiClient from "@/lib/api/client"
import { useUserStore } from "@/stores/user-store"

export function useUnreadMessages() {
  const pathname = usePathname()
  const profile = useUserStore((s) => s.profile)
  const { socket } = useSocket(profile?.id)
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)

  useEffect(() => {
    if (!profile) return
    apiClient
      .get("/api/conversations/")
      .then((res) => {
        if (res.data?.success) {
          const conversations = res.data.data
          const unread = conversations.some((c: any) => c.hasUnread)
          setHasUnreadMessages(unread)
        }
      })
      .catch((err) => {
        if (err.response?.status !== 401) {
          console.error("Error fetching conversations:", err)
        }
      })
  }, [profile, pathname]) // Re-fetch when pathname changes to clear the badge if they visit the conversation

  useEffect(() => {
    if (!socket) return
    const handleNewMessage = (message: any) => {
      // If we are currently reading this exact conversation, it's automatically marked as read
      // by the conversation page. So it doesn't trigger the unread badge.
      if (pathname === `/messages/${message.conversationId}`) {
        return
      }

      // For any other page (including the messages list or other conversations), it's unread!
      setHasUnreadMessages(true)
    }
    socket.on("message:new", handleNewMessage)
    return () => {
      socket.off("message:new", handleNewMessage)
    }
  }, [socket, pathname])

  return hasUnreadMessages
}
