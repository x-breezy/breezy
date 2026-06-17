import { sseService } from "../../services/sse.service"
import type { Response } from "express"

describe("SseService", () => {
  let mockRes: jest.Mocked<Partial<Response>>
  let closeHandler: () => void

  beforeEach(() => {
    closeHandler = jest.fn()
    mockRes = {
      write: jest.fn(),
      on: jest.fn((_event: string, cb: () => void) => {
        closeHandler = cb
        return mockRes
      }) as jest.Mock,
    }
  })

  afterEach(() => {
    // Trigger close to clear heartbeat intervals
    if (closeHandler) closeHandler()
    jest.useRealTimers()
  })

  it("registers a connection and starts heartbeat", () => {
    jest.useFakeTimers()
    sseService.register("user-1", mockRes as Response)
    expect(mockRes.on).toHaveBeenCalledWith("close", expect.any(Function))
    jest.advanceTimersByTime(25000)
    expect(mockRes.write).toHaveBeenCalledWith(": ping\n\n")
  })

  it("pushes notification data to registered client", () => {
    sseService.register("user-1", mockRes as Response)
    sseService.push("user-1", { type: "like", postId: "post-1" })
    expect(mockRes.write).toHaveBeenCalledWith(
      'event: notification\ndata: {"type":"like","postId":"post-1"}\n\n'
    )
  })

  it("does nothing when pushing to unregistered user", () => {
    sseService.push("unknown-user", { type: "test" })
    expect(mockRes.write).not.toHaveBeenCalled()
  })

  it("does nothing when no clients for user", () => {
    sseService.push("user-1", { type: "test" })
    expect(mockRes.write).not.toHaveBeenCalled()
  })
})
