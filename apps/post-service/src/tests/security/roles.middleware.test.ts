import express, { type Request, type Response, type NextFunction } from "express"
import request from "supertest"
import {
  requirePermission,
  requireSelfOrPermission,
  requireOwnership,
} from "../../middlewares/roles.middleware"

describe("requirePermission", () => {
  it("allows when user has matching permissions", async () => {
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "user-1", role: "user", permissions: ["post:read"] } as Request["user"]
      next()
    })
    app.get("/test", requirePermission("post:read"), (_req: Request, res: Response) => {
      res.json({ ok: true })
    })
    const res = await request(app).get("/test")
    expect(res.status).toBe(200)
  })

  it("denies when user lacks permissions", async () => {
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "user-1", role: "user", permissions: [] } as Request["user"]
      next()
    })
    app.get("/test", requirePermission("post:admin"), (_req: Request, res: Response) => {
      res.json({ ok: true })
    })
    const res = await request(app).get("/test")
    expect(res.status).toBe(403)
    expect(res.body).toEqual({ success: false, error: "Forbidden", required: "post:admin" })
  })

  it("returns 401 when req.user is missing", async () => {
    const app = express()
    app.get("/test", requirePermission("post:read"), (_req: Request, res: Response) => {
      res.json({ ok: true })
    })
    const res = await request(app).get("/test")
    expect(res.status).toBe(401)
  })
})

describe("requireSelfOrPermission", () => {
  it("allows self", async () => {
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "user-1", role: "user", permissions: [] } as Request["user"]
      next()
    })
    app.get("/test/:id", requireSelfOrPermission("id"), (_req: Request, res: Response) => {
      res.json({ ok: true })
    })
    const res = await request(app).get("/test/user-1")
    expect(res.status).toBe(200)
  })

  it("allows user with elevated permission for non-self", async () => {
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "user-1", role: "user", permissions: ["post:admin"] } as Request["user"]
      next()
    })
    app.get(
      "/test/:id",
      requireSelfOrPermission("id", "post:admin"),
      (_req: Request, res: Response) => {
        res.json({ ok: true })
      }
    )
    const res = await request(app).get("/test/other-user")
    expect(res.status).toBe(200)
  })

  it("denies non-self without required permission", async () => {
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "user-1", role: "user", permissions: [] } as Request["user"]
      next()
    })
    app.get(
      "/test/:id",
      requireSelfOrPermission("id", "post:admin"),
      (_req: Request, res: Response) => {
        res.json({ ok: true })
      }
    )
    const res = await request(app).get("/test/other-user")
    expect(res.status).toBe(403)
  })

  it("returns 401 when req.user is missing", async () => {
    const app = express()
    app.get("/test/:id", requireSelfOrPermission("id"), (_req: Request, res: Response) => {
      res.json({ ok: true })
    })
    const res = await request(app).get("/test/other-user")
    expect(res.status).toBe(401)
  })
})

describe("requireOwnership", () => {
  it("allows owner to access resource", async () => {
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "user-1", role: "user", permissions: [] } as Request["user"]
      next()
    })
    app.get(
      "/test/:id",
      requireOwnership(async (req) => ({ authorId: req.params.id }) as never, "post:admin"),
      (_req: Request, res: Response) => {
        res.json({ ok: true })
      }
    )
    const res = await request(app).get("/test/user-1")
    expect(res.status).toBe(200)
  })

  it("allows user with elevated permission for non-owned resource", async () => {
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "user-1", role: "user", permissions: ["post:admin"] } as Request["user"]
      next()
    })
    app.get(
      "/test/:id",
      requireOwnership(async () => ({ authorId: "other-user" }) as never, "post:admin"),
      (_req: Request, res: Response) => {
        res.json({ ok: true })
      }
    )
    const res = await request(app).get("/test/other-user")
    expect(res.status).toBe(200)
  })

  it("denies non-owner without elevated permission", async () => {
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "user-1", role: "user", permissions: [] } as Request["user"]
      next()
    })
    app.get(
      "/test/:id",
      requireOwnership(async () => ({ authorId: "other-user" }) as never, "post:admin"),
      (_req: Request, res: Response) => {
        res.json({ ok: true })
      }
    )
    const res = await request(app).get("/test/other-user")
    expect(res.status).toBe(403)
  })

  it("returns 404 when resource not found", async () => {
    const app = express()
    app.use((req: Request, _res: Response, next: NextFunction) => {
      req.user = { id: "user-1", role: "user", permissions: [] } as Request["user"]
      next()
    })
    app.get(
      "/test/:id",
      requireOwnership(async () => null as never, "post:admin"),
      (_req: Request, res: Response) => {
        res.json({ ok: true })
      }
    )
    const res = await request(app).get("/test/other-user")
    expect(res.status).toBe(404)
  })
})
