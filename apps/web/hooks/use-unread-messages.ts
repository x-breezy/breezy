import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useSocket } from "@/hooks/use-socket"
import { useUserStore } from "@/stores/user-store"
import { useConversationStore } from "@/stores/conversation-store"

export function useUnreadMessages() {
  const pathname = usePathname()
  const profileId = useUserStore((s) => s.profile?.profileId) // was profile?.id ,  bug fix
  const { socket } = useSocket(profileId)

  const fetchConversations = useConversationStore((s) => s.fetchConversations)
  const totalUnread = useConversationStore((s) =>
    s.conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)
  )

  // Populate store when not on /messages (layout handles it there).
  // Read state imperatively ,  depending reactively on conversations.length would re-trigger
  // the effect after every fetch that returns [], creating an infinite loop.
  useEffect(() => {
    if (!profileId) return
    const { conversations, loading } = useConversationStore.getState()
    if (conversations.length > 0 || loading) return
    void fetchConversations()
  }, [profileId, fetchConversations])

  // Socket: incoming message on another page → refetch so store unread flag stays accurate
  // ponytail: refetch is heavier than a local flag; add store.markHasUnread() if this causes perf issues
  useEffect(() => {
    if (!socket) return
    const handle = (msg: { conversationId: string }) => {
      if (pathname !== `/messages/${msg.conversationId}`) {
        fetchConversations()
      }
    }
    socket.on("message:new", handle)
    return () => {
      socket.off("message:new", handle)
    }
  }, [socket, pathname, fetchConversations])

  return totalUnread
}
