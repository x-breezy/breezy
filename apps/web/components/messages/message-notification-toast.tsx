"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { toast } from "sonner"
import { useSocket } from "@/hooks/use-socket"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useConversationStore } from "@/stores/conversation-store"
import { useUserCache } from "@/hooks/use-user-cache"

type IncomingMessage = {
  conversationId: string
  senderId: string
  content: string
  isSystem?: boolean
}

export function MessageNotificationToast() {
  const { currentUserId } = useCurrentUser()
  const { socket } = useSocket(currentUserId)
  const pathname = usePathname()
  const router = useRouter()
  const conversations = useConversationStore((s) => s.conversations)
  const cachedUsers = useUserCache((s) => s.users)

  useEffect(() => {
    if (!socket || !currentUserId) return

    const handle = (msg: IncomingMessage) => {
      if (pathname === `/messages/${msg.conversationId}`) return
      if (msg.isSystem) return
      if (msg.senderId === currentUserId) return

      const conv = conversations.find((c) => c._id === msg.conversationId)
      const cached = cachedUsers[msg.senderId]

      const senderName = cached
        ? cached.displayName.split(" @")[0] || cached.displayName
        : "New message"

      const title = conv?.isGroup && conv.name ? `${senderName} in ${conv.name}` : senderName

      const preview = msg.content.length > 80 ? `${msg.content.slice(0, 80)}…` : msg.content

      toast(title, {
        description: preview,
        action: {
          label: "View",
          onClick: () => router.push(`/messages/${msg.conversationId}`),
        },
      })
    }

    socket.on("message:new", handle)
    return () => {
      socket.off("message:new", handle)
    }
  }, [socket, currentUserId, pathname, conversations, cachedUsers, router])

  return null
}
