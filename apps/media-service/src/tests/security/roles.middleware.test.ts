import express, { type Request, type Response, type NextFunction } from "express"
import request from "supertest"
import { requireRoles, requireSelfOrRoles } from "../../middlewares/roles.middleware"

function buildApp(useMiddleware: ReturnType<typeof requireRoles | typeof requireSelfOrRoles>) {
  const app = express()
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: "user-1", role: "user" } as Request["user"]
    next()
  })
  app.get("/test/:id", useMiddleware, (_req: Request, res: Response) => {
    res.json({ ok: true })
  })
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message })
  })
  return app
}

function buildAppNoUser(
  useMiddleware: ReturnType<typeof requireRoles | typeof requireSelfOrRoles>
) {
  const app = express()
  app.get("/test/:id", useMiddleware, (_req: Request, res: Response) => {
    res.json({ ok: true })
  })
  return app
}

describe("requireRoles", () => {
  it("allows user with matching role", async () => {
    const app = buildApp(requireRoles("user"))
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(200)
  })

  it("allows user with one of multiple matching roles", async () => {
    const app = buildApp(requireRoles("admin", "user"))
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(200)
  })

  it("denies user without matching role", async () => {
    const app = buildApp(requireRoles("admin"))
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ success: false, error: "Forbidden" })
  })

  it("denies when req.user is missing", async () => {
    const app = buildAppNoUser(requireRoles("user"))
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(403)
  })
})

describe("requireSelfOrRoles", () => {
  it("allows self when param matches user id", async () => {
    const app = buildApp(requireSelfOrRoles("id"))
    const res = await request(app).get("/test/user-1")
    expect(res.status).toBe(200)
  })

  it("allows elevated role for non-self", async () => {
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "user-1", role: "admin" } as Request["user"]
      next()
    })
    app.get("/test/:id", requireSelfOrRoles("id", "admin"), (_req: Request, res: Response) => {
      res.json({ ok: true })
    })
    const res = await request(app).get("/test/other-user")
    expect(res.status).toBe(200)
  })

  it("denies non-self without elevated role", async () => {
    const app = buildApp(requireSelfOrRoles("id", "admin"))
    const res = await request(app).get("/test/other-user")
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ success: false, error: "Forbidden" })
  })

  it("denies when req.user is missing", async () => {
    const app = buildAppNoUser(requireSelfOrRoles("id"))
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(403)
  })
})
