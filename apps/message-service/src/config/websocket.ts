import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"
import { createLogger } from "@breezy/logger"

const logger = createLogger({ service: "message-service-ws" })

let io: SocketIOServer | null = null

export function setupWebSocket(server: HTTPServer): void {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*", // Or specific frontend domains
      methods: ["GET", "POST"],
    },
  })

  // Basic authentication middleware
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId || socket.handshake.query.userId
    if (!userId || typeof userId !== "string") {
      logger.warn("Socket connection rejected: Missing userId")
      return next(new Error("Authentication error: Missing userId"))
    }
    
    // Attach userId to the socket for later use
    socket.data.userId = userId
    next()
  })

  io.on("connection", (socket) => {
    const userId = socket.data.userId
    logger.info({ userId, socketId: socket.id }, "Client connected to WebSocket")

    // Join the user to a room named by their own user ID
    // This allows us to emit to all their connected devices via `io.to(userId)`
    socket.join(userId)

    socket.on("disconnect", () => {
      logger.info({ userId, socketId: socket.id }, "Client disconnected from WebSocket")
    })
  })
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.io not initialized! Call setupWebSocket first.")
  }
  return io
}
