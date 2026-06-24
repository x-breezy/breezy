import { useEffect, useState, useCallback } from "react"
import { useSocket } from "./use-socket"
import {
  listMessages,
  sendMessage as sendMessageAction,
  markConversationRead,
  type ReplyTo,
} from "@/lib/actions/messages"

export type { Message } from "@/lib/actions/messages"

const PAGE_SIZE = 100

export function useConversation(conversationId: string, userId: string | undefined) {
  const { socket, isConnected } = useSocket(userId)
  const [messages, setMessages] = useState<Awaited<ReturnType<typeof listMessages>>["data"]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // Fetch initial history
  useEffect(() => {
    if (!conversationId || !userId) return

    listMessages(conversationId, 1, PAGE_SIZE)
      .then((res) => {
        setMessages([...res.data].reverse())
        setTotal(res.total)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [conversationId, userId])

  const loadMore = useCallback(async () => {
    if (loadingMore || messages.length >= total) return
    const nextPage = page + 1
    setLoadingMore(true)
    try {
      const res = await listMessages(conversationId, nextPage, PAGE_SIZE)
      setMessages((prev) => [...res.data.reverse(), ...prev])
      setPage(nextPage)
      setTotal(res.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingMore(false)
    }
  }, [conversationId, loadingMore, messages.length, page, total])

  // Listen for new messages
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleNewMessage = (
      message: Awaited<ReturnType<typeof listMessages>>["data"][number]
    ) => {
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
    async (content: string, replyTo?: ReplyTo) => {
      if (!conversationId || !userId) return
      try {
        const message = await sendMessageAction(conversationId, content, replyTo)
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

  return { messages, loading, loadingMore, loadMore, hasMore: messages.length < total, sendMessage }
}
