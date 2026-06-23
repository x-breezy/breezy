"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast as sonnerToast } from "sonner"
import { useSocket } from "@/hooks/use-socket"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useConversationStore } from "@/stores/conversation-store"
import { useUserCache } from "@/hooks/use-user-cache"
import { MessageNotificationCard } from "./message-notification-card"

type IncomingMessage = {
  conversationId: string
  senderId: string
  content: string
  isSystem?: boolean
}

export function MessageNotificationToast() {
  const t = useTranslations("messages")
  const { currentUserId } = useCurrentUser()
  const { socket } = useSocket(currentUserId)
  const pathname = usePathname()
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
        : t("someone")

      const preview = msg.content.length > 80 ? `${msg.content.slice(0, 80)}…` : msg.content

      sonnerToast.custom((id) => (
        <MessageNotificationCard
          senderName={senderName}
          senderAvatar={cached?.avatarUrl}
          conversationName={conv?.isGroup ? conv.name : undefined}
          preview={preview}
          conversationId={msg.conversationId}
          onDismiss={() => sonnerToast.dismiss(id)}
          className='rounded-lg bg-background shadow-lg ring-1 ring-border md:max-w-91 md:min-w-91'
        />
      ))
    }

    socket.on("message:new", handle)
    return () => {
      socket.off("message:new", handle)
    }
  }, [socket, currentUserId, pathname, conversations, cachedUsers, t])

  return null
}
