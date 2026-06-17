import express, { type Request, type Response, type NextFunction } from "express"
import request from "supertest"
import { createNotificationRouter } from "../../routes/notification.route"
import NotificationController from "../../controllers/notification.controller"
import { verifyJwt } from "../../utils/jwt"

jest.mock("../../utils/jwt")
const mockVerifyJwt = verifyJwt as jest.MockedFunction<typeof verifyJwt>

const mockService = {
  list: jest.fn(),
  markRead: jest.fn(),
  markAllRead: jest.fn(),
  remove: jest.fn(),
}

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use(
    "/notifications",
    createNotificationRouter(new NotificationController(mockService as never))
  )
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ success: false, error: "Internal server error" })
  })
  return app
}

const app = buildApp()
const USER_ID = "user-abc-123"

beforeEach(() => {
  jest.clearAllMocks()
  mockVerifyJwt.mockReturnValue({ sub: USER_ID, role: "user" })
})

// ── GET /notifications ────────────────────────────────────────────────────────

describe("GET /notifications", () => {
  it("returns 401 when x-user-id missing", async () => {
    const res = await request(app).get("/notifications")
    expect(res.status).toBe(401)
    expect(mockService.list).not.toHaveBeenCalled()
  })

  it("returns 200 with paginated notifications", async () => {
    mockService.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })
    const res = await request(app).get("/notifications").set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(mockService.list).toHaveBeenCalledWith(USER_ID, { page: 1, limit: 20, read: undefined })
  })

  it("passes page and limit query params", async () => {
    mockService.list.mockResolvedValue({ data: [], total: 0, page: 2, limit: 5 })
    const res = await request(app)
      .get("/notifications?page=2&limit=5")
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(200)
    expect(mockService.list).toHaveBeenCalledWith(USER_ID, { page: 2, limit: 5, read: undefined })
  })

  it("passes read=true filter", async () => {
    mockService.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })
    await request(app).get("/notifications?read=true").set("Authorization", "Bearer fake-token")
    expect(mockService.list).toHaveBeenCalledWith(USER_ID, expect.objectContaining({ read: true }))
  })

  it("passes read=false filter", async () => {
    mockService.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })
    await request(app).get("/notifications?read=false").set("Authorization", "Bearer fake-token")
    expect(mockService.list).toHaveBeenCalledWith(USER_ID, expect.objectContaining({ read: false }))
  })

  it("rejects limit > 100 with 400", async () => {
    const res = await request(app)
      .get("/notifications?limit=200")
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(400)
    expect(mockService.list).not.toHaveBeenCalled()
  })

  it("returns 500 on service error", async () => {
    mockService.list.mockRejectedValue(new Error("DB failure"))
    const res = await request(app).get("/notifications").set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(500)
  })
})

// ── PATCH /notifications/read-all ─────────────────────────────────────────────

describe("PATCH /notifications/read-all", () => {
  it("returns 401 when x-user-id missing", async () => {
    const res = await request(app).patch("/notifications/read-all")
    expect(res.status).toBe(401)
  })

  it("returns 200 and marks all read", async () => {
    mockService.markAllRead.mockResolvedValue(undefined)
    const res = await request(app)
      .patch("/notifications/read-all")
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(mockService.markAllRead).toHaveBeenCalledWith(USER_ID)
  })

  it("returns 500 on service error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    mockService.markAllRead.mockRejectedValue(new Error("db error"))
    const res = await request(app)
      .patch("/notifications/read-all")
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(500)
  })
})

// ── PATCH /notifications/:id/read ─────────────────────────────────────────────

describe("PATCH /notifications/:id/read", () => {
  it("returns 401 when x-user-id missing", async () => {
    const res = await request(app).patch("/notifications/notif1/read")
    expect(res.status).toBe(401)
  })

  it("returns 400 when id param is empty", async () => {
    const res = await request(app)
      .patch("/notifications//read")
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(404)
  })

  it("returns 200 when notification marked read", async () => {
    mockService.markRead.mockResolvedValue(true)
    const res = await request(app)
      .patch("/notifications/notif1/read")
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(mockService.markRead).toHaveBeenCalledWith("notif1", USER_ID)
  })

  it("returns 404 when notification not found", async () => {
    mockService.markRead.mockResolvedValue(false)
    const res = await request(app)
      .patch("/notifications/missing/read")
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it("returns 500 on service error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    mockService.markRead.mockRejectedValue(new Error("db error"))
    const res = await request(app)
      .patch("/notifications/notif1/read")
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(500)
  })
})

// ── DELETE /notifications/:id ─────────────────────────────────────────────────

describe("DELETE /notifications/:id", () => {
  it("returns 401 when x-user-id missing", async () => {
    const res = await request(app).delete("/notifications/notif1")
    expect(res.status).toBe(401)
  })

  it("returns 204 when notification deleted", async () => {
    mockService.remove.mockResolvedValue(true)
    const res = await request(app)
      .delete("/notifications/notif1")
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(204)
    expect(mockService.remove).toHaveBeenCalledWith("notif1", USER_ID)
  })

  it("returns 404 when notification not found", async () => {
    mockService.remove.mockResolvedValue(false)
    const res = await request(app)
      .delete("/notifications/missing")
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(404)
  })

  it("returns 500 on service error", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    mockService.remove.mockRejectedValue(new Error("db error"))
    const res = await request(app)
      .delete("/notifications/notif1")
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(500)
  })
})
