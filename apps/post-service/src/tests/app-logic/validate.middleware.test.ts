import express, { type Request, type Response } from "express"
import request from "supertest"
import { z } from "zod"
import { validate } from "../../middlewares/validate.middleware"

const testSchema = z.object({ name: z.string().min(1) })

describe("validate middleware", () => {
  it("passes valid body to next", async () => {
    const app = express()
    app.use(express.json())
    app.post("/test", validate(testSchema), (req: Request, res: Response) => {
      res.json({ name: req.body.name })
    })
    const res = await request(app).post("/test").send({ name: "alice" })
    expect(res.status).toBe(200)
    expect(res.body.name).toBe("alice")
  })

  it("rejects invalid body with 400", async () => {
    const app = express()
    app.use(express.json())
    app.post("/test", validate(testSchema), (_req: Request, res: Response) => {
      res.json({ ok: true })
    })
    const res = await request(app).post("/test").send({ name: "" })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error).toBeDefined()
  })

  it("validates params target", async () => {
    const paramSchema = z.object({ id: z.string().uuid() })
    const app = express()
    app.get("/test/:id", validate(paramSchema, "params"), (req: Request, res: Response) => {
      res.json({ id: req.params.id })
    })
    const res = await request(app).get("/test/not-a-uuid")
    expect(res.status).toBe(400)
  })

  it("validates query target", async () => {
    const querySchema = z.object({ q: z.string().min(1) })
    const app = express()
    app.get("/test", validate(querySchema, "query"), (_req: Request, res: Response) => {
      res.json({ ok: true })
    })
    const res = await request(app).get("/test?q=")
    expect(res.status).toBe(400)
  })
})
