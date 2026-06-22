import { useEffect, useState, useCallback } from "react"
import { useSocket } from "./use-socket"
import {
  listMessages,
  sendMessage as sendMessageAction,
  markConversationRead,
} from "@/lib/actions/messages"

export type { Message } from "@/lib/actions/messages"

export function useConversation(conversationId: string, userId: string | undefined) {
  const { socket, isConnected } = useSocket(userId)
  const [messages, setMessages] = useState<Awaited<ReturnType<typeof listMessages>>>([])
  const [loading, setLoading] = useState(true)

  // Fetch initial history
  useEffect(() => {
    if (!conversationId || !userId) return

    setLoading(true)
    listMessages(conversationId)
      .then((msgs) => setMessages([...msgs].reverse()))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [conversationId, userId])

  // Listen for new messages
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNewMessage = (message: Awaited<ReturnType<typeof listMessages>>[number]) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev
          return [...prev, message]
        })
      }
    }

    socket.on("message:new", handleNewMessage)
    return () => {
      socket.off("message:new", handleNewMessage)
    }
  }, [socket, isConnected, conversationId])

  // Mark as read when viewing or receiving new messages
  useEffect(() => {
    if (!conversationId || !userId || messages.length === 0) return
    markConversationRead(conversationId).catch((err) =>
      console.error("Failed to mark as read", err)
    )
  }, [conversationId, userId, messages])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !userId) return
      try {
        const message = await sendMessageAction(conversationId, content)
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev
          return [...prev, message]
        })
      } catch (err) {
        console.error("Failed to send message", err)
      }
    },
    [conversationId, userId]
  )

  return { messages, loading, sendMessage, isConnected }
}
