import type { Response } from "express"

// Heartbeat interval in ms, keeps idle connections alive through proxies and
// surfaces dead sockets without waiting for the 3600s proxy_read_timeout.
const HEARTBEAT_INTERVAL_MS = 25_000

class SseService {
  private connections = new Map<string, Set<Response>>()
  private heartbeats = new Map<Response, ReturnType<typeof setInterval>>()

  register(userId: string, res: Response): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set())
    }
    this.connections.get(userId)!.add(res)

    const ping = setInterval(() => res.write(": ping\n\n"), HEARTBEAT_INTERVAL_MS)
    this.heartbeats.set(res, ping)

    res.on("close", () => this.unregister(userId, res))
  }

  private unregister(userId: string, res: Response): void {
    const ping = this.heartbeats.get(res)
    if (ping) {
      clearInterval(ping)
      this.heartbeats.delete(res)
    }
    this.connections.get(userId)?.delete(res)
  }

  push(userId: string, data: object): void {
    const clients = this.connections.get(userId)
    if (!clients?.size) return
    const payload = `event: notification\ndata: ${JSON.stringify(data)}\n\n`
    for (const res of clients) {
      res.write(payload)
    }
  }
}

export const sseService = new SseService()
