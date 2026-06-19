import { useEffect, useState, useCallback } from "react"
import { useSocket } from "./use-socket"
import apiClient from "../lib/api/client"

export interface Message {
  _id: string
  conversationId: string
  senderId: string
  content: string
  isSystem?: boolean
  readAt: string | null
  createdAt: string
  updatedAt: string
}

export function useConversation(conversationId: string, userId: string | undefined) {
  const { socket, isConnected } = useSocket(userId)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch initial history
  useEffect(() => {
    if (!conversationId || !userId) return

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    
    apiClient.get(`/api/conversations/${conversationId}/messages`)
      .then((res) => {
        const data = res.data
        if (data.success && data.data) {
          // APIs return paginated, usually newest first. We reverse them for chat view.
          setMessages([...data.data].reverse())
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [conversationId, userId])

  // Listen for new messages
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
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

    const markRead = async () => {
      try {
        await apiClient.patch(`/api/conversations/${conversationId}/read`)
      } catch (err) {
        console.error("Failed to mark as read", err)
      }
    }
    
    markRead()
  }, [conversationId, userId, messages])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !userId) return

      try {
        const res = await apiClient.post(`/api/conversations/${conversationId}/messages`, { content })
        const data = res.data
        
        if (data.success && data.data) {
          // Optimistically we could add it before API responds, 
          // but for now let's just append the real one returned.
          setMessages((prev) => {
            if (prev.some(m => m._id === data.data._id)) return prev;
            return [...prev, data.data]
          })
        }
      } catch (err) {
        console.error("Failed to send message", err)
      }
    },
    [conversationId, userId]
  )

  return { messages, loading, sendMessage, isConnected }
}
