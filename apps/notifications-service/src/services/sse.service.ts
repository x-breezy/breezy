import type { Response } from "express"

class SseService {
  private connections = new Map<string, Set<Response>>()

  register(userId: string, res: Response): void {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set())
    }
    this.connections.get(userId)!.add(res)
    res.on("close", () => this.unregister(userId, res))
  }

  private unregister(userId: string, res: Response): void {
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
