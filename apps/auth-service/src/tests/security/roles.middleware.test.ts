import express, { type Request, type Response, type NextFunction } from "express"
import request from "supertest"
import {
  requirePermission,
  requireSelfOrPermission,
  requireOwnership,
} from "../../middlewares/roles.middleware"

function buildApp(useMiddleware: ReturnType<typeof requirePermission>) {
  const app = express()
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.user = { id: "user-1", role: "user", permissions: ["user:me", "report:create"] }
    next()
  })
  app.get("/test/:id", useMiddleware, (_req: Request, res: Response) => {
    res.json({ ok: true })
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message })
  })
  return app
}

function buildAppNoUser(useMiddleware: ReturnType<typeof requirePermission>) {
  const app = express()
  app.get("/test/:id", useMiddleware, (_req: Request, res: Response) => {
    res.json({ ok: true })
  })
  return app
}

function buildAppAdmin(useMiddleware: ReturnType<typeof requirePermission>) {
  const app = express()
  app.use((req: Request, _res: Response, next: NextFunction) => {
    req.user = {
      id: "admin-1",
      role: "admin",
      permissions: [
        "user:me",
        "report:create",
        "report:resolve",
        "user:read",
        "user:suspend",
        "user:ban",
        "user:create",
      ],
    }
    next()
  })
  app.get("/test/:id", useMiddleware, (_req: Request, res: Response) => {
    res.json({ ok: true })
  })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message })
  })
  return app
}

describe("requirePermission", () => {
  it("allows user with matching permission", async () => {
    const app = buildApp(requirePermission("report:create"))
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(200)
  })

  it("denies user without required permission", async () => {
    const app = buildApp(requirePermission("user:ban"))
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(403)
    expect(res.body).toMatchObject({ success: false, error: "Forbidden", required: "user:ban" })
  })

  it("denies when req.user is missing", async () => {
    const app = buildAppNoUser(requirePermission("report:create"))
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(401)
  })

  it("returns 401 for missing user before checking permissions", async () => {
    const app = buildAppNoUser(requirePermission("anything"))
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ success: false, error: "Unauthorized" })
  })

  it("allows admin with elevated permission", async () => {
    const app = buildAppAdmin(requirePermission("user:read"))
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(200)
  })
})

describe("requireSelfOrPermission", () => {
  const buildSelfApp = (elevatedPermission?: string) => {
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "user-1", role: "user", permissions: ["user:me"] }
      next()
    })
    app.get(
      "/test/:id",
      requireSelfOrPermission("id", elevatedPermission as never),
      (_req: Request, res: Response) => {
        res.json({ ok: true })
      }
    )
    return app
  }

  it("allows self when param matches user id", async () => {
    const app = buildSelfApp()
    const res = await request(app).get("/test/user-1")
    expect(res.status).toBe(200)
  })

  it("allows elevated role for non-self", async () => {
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = {
        id: "admin-1",
        role: "admin",
        permissions: [
          "user:me",
          "report:create",
          "report:resolve",
          "user:read",
          "user:suspend",
          "user:ban",
          "user:create",
        ],
      }
      next()
    })
    app.get(
      "/test/:id",
      requireSelfOrPermission("id", "user:read"),
      (_req: Request, res: Response) => {
        res.json({ ok: true })
      }
    )
    const res = await request(app).get("/test/other-user")
    expect(res.status).toBe(200)
  })

  it("denies non-self without elevated permission", async () => {
    const app = buildSelfApp("user:ban")
    const res = await request(app).get("/test/other-user")
    expect(res.status).toBe(403)
    expect(res.body).toMatchObject({ success: false, error: "Forbidden" })
  })

  it("denies when req.user is missing", async () => {
    const app = express()
    app.get("/test/:id", requireSelfOrPermission("id"), (_req: Request, res: Response) => {
      res.json({ ok: true })
    })
    const res = await request(app).get("/test/user-1")
    expect(res.status).toBe(401)
    expect(res.body).toMatchObject({ success: false, error: "Unauthorized" })
  })

  it("allows self when no elevated permission defined", async () => {
    const app = buildSelfApp()
    const res = await request(app).get("/test/user-1")
    expect(res.status).toBe(200)
  })
})

describe("requireOwnership", () => {
  it("allows owner of resource", async () => {
    const fetch = jest.fn().mockResolvedValue({ authorId: "user-1" })
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "user-1", role: "user", permissions: ["user:me"] }
      next()
    })
    app.get(
      "/test/:id",
      requireOwnership(fetch, "user:ban" as never),
      (_req: Request, res: Response) => {
        res.json({ ok: true })
      }
    )
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(200)
    expect(fetch).toHaveBeenCalled()
  })

  it("allows elevated role for non-owner", async () => {
    const fetch = jest.fn().mockResolvedValue({ authorId: "other-user" })
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = {
        id: "admin-1",
        role: "admin",
        permissions: [
          "user:me",
          "report:create",
          "report:resolve",
          "user:read",
          "user:suspend",
          "user:ban",
          "user:create",
        ],
      }
      next()
    })
    app.get("/test/:id", requireOwnership(fetch, "user:ban"), (_req: Request, res: Response) => {
      res.json({ ok: true })
    })
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(200)
  })

  it("denies non-owner without elevated permission", async () => {
    const fetch = jest.fn().mockResolvedValue({ authorId: "other-user" })
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "user-1", role: "user", permissions: ["user:me"] }
      next()
    })
    app.get("/test/:id", requireOwnership(fetch, "user:ban"), (_req: Request, res: Response) => {
      res.json({ ok: true })
    })
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(403)
  })

  it("returns 404 when resource not found", async () => {
    const fetch = jest.fn().mockResolvedValue(null)
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "user-1", role: "user", permissions: ["user:me"] }
      next()
    })
    app.get("/test/:id", requireOwnership(fetch, "user:ban"), (_req: Request, res: Response) => {
      res.json({ ok: true })
    })
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(404)
  })

  it("denies when req.user is missing", async () => {
    const fetch = jest.fn().mockResolvedValue({ authorId: "user-1" })
    const app = express()
    app.get("/test/:id", requireOwnership(fetch, "user:ban"), (_req: Request, res: Response) => {
      res.json({ ok: true })
    })
    const res = await request(app).get("/test/abc")
    expect(res.status).toBe(403)
  })
})
