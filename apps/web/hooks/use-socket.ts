import { useEffect, useRef, useState } from "react"
import { io, Socket } from "socket.io-client"

export function useSocket(userId: string | undefined) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!userId) return

    // Ensure we don't create multiple connections
    if (socketRef.current) return

    const socketInstance = io(process.env.NEXT_PUBLIC_MESSAGE_WS_URL || "http://localhost:4030", {
      auth: { userId },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socketInstance

    socketInstance.on("connect", () => {
      console.log("WebSocket connected:", socketInstance.id)
      setIsConnected(true)
      setSocket(socketInstance)
    })

    socketInstance.on("disconnect", () => {
      console.log("WebSocket disconnected")
      setIsConnected(false)
    })

    return () => {
      socketInstance.disconnect()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
    }
  }, [userId])

  return { socket, isConnected }
}
