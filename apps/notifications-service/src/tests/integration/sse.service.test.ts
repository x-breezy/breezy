import type { Response } from "express"
import { sseService } from "../../services/sse.service"

function mockRes(): Response & { written: string[] } {
  const written: string[] = []
  let closeHandler: (() => void) | null = null
  const res = {
    written,
    write: jest.fn((data: string) => {
      written.push(data)
      return true
    }),
    on: jest.fn((event: string, cb: () => void) => {
      if (event === "close") closeHandler = cb
    }),
    emit: jest.fn((event: string) => {
      if (event === "close" && closeHandler) closeHandler()
    }),
  } as unknown as Response & { written: string[] }
  return res
}

// SseService is a singleton, use unique userIds to avoid cross-test leakage
let uid = 0
const nextId = () => `user-${uid++}`

describe("SseService", () => {
  describe("register", () => {
    it("registers a connection for a user", () => {
      const userId = nextId()
      const res = mockRes()
      sseService.register(userId, res)
      sseService.push(userId, { test: true })
      expect(res.write).toHaveBeenCalledTimes(1)
    })

    it("registers multiple connections for the same user", () => {
      const userId = nextId()
      const res1 = mockRes()
      const res2 = mockRes()
      sseService.register(userId, res1)
      sseService.register(userId, res2)
      sseService.push(userId, { msg: "hi" })
      expect(res1.write).toHaveBeenCalledTimes(1)
      expect(res2.write).toHaveBeenCalledTimes(1)
    })

    it("removes connection on close event", () => {
      const userId = nextId()
      const res = mockRes()
      sseService.register(userId, res)
      ;(res as unknown as { emit: (e: string) => void }).emit("close")
      sseService.push(userId, { after: "close" })
      expect(res.write).not.toHaveBeenCalled()
    })
  })

  describe("push", () => {
    it("sends SSE-formatted event payload", () => {
      const userId = nextId()
      const res = mockRes()
      sseService.register(userId, res)
      const data = { type: "follow" }
      sseService.push(userId, data)
      expect(res.written[0]).toBe(`event: notification\ndata: ${JSON.stringify(data)}\n\n`)
    })

    it("is a no-op for unknown user", () => {
      expect(() => sseService.push("unknown-user-xyz", { x: 1 })).not.toThrow()
    })
  })
})
