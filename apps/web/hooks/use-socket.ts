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

    // Connect through the gateway, which proxies /socket.io/ to message-service.
    // - prod: the app is served BY the gateway → same origin ("") routes to /socket.io/.
    // - dev:  Next runs on :3000 but the gateway is :80, so same-origin would 404 →
    //         target the gateway origin explicitly.
    // NEXT_PUBLIC_WS_URL overrides both when set (e.g. a dedicated WS domain).
    const isDevSplitOrigin = typeof window !== "undefined" && window.location.port === "3000"
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL ?? (isDevSplitOrigin ? "http://localhost" : "")
    const socketInstance = io(wsUrl, {
      auth: { userId },
      withCredentials: true, // send breezy-token cookie on WS handshake for gateway auth
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = socketInstance

    socketInstance.on("connect", () => {
      setIsConnected(true)
      setSocket(socketInstance)
    })

    socketInstance.on("disconnect", () => {
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
