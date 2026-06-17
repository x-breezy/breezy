import express from "express"
import request from "supertest"
import {
  emailSendRateLimit,
  authenticatedEmailRateLimit,
} from "../../middlewares/email-rate-limit.middleware"

function buildApp() {
  const app = express()
  app.use(express.json())
  app.post("/test-email", emailSendRateLimit, (_req, res) => {
    res.json({ success: true })
  })
  app.post("/test-authenticated", authenticatedEmailRateLimit, (_req, res) => {
    res.json({ success: true })
  })
  return app
}

describe("emailSendRateLimit", () => {
  it("allows first request", async () => {
    const app = buildApp()
    const res = await request(app).post("/test-email").send({ email: "test@example.com" })
    expect(res.status).toBe(200)
  })

  it("blocks duplicate email within time window", async () => {
    const app = buildApp()
    await request(app).post("/test-email").send({ email: "dup@example.com" })
    const res = await request(app).post("/test-email").send({ email: "dup@example.com" })
    expect(res.status).toBe(429)
    expect(res.body.code).toBe("EMAIL_SEND_RATE_LIMITED")
  })

  it("allows different emails", async () => {
    const app = buildApp()
    await request(app).post("/test-email").send({ email: "one@example.com" })
    const res = await request(app).post("/test-email").send({ email: "two@example.com" })
    expect(res.status).toBe(200)
  })

  it("uses IP when no email in body and rate limits", async () => {
    const app = buildApp()
    await request(app).post("/test-email").send({})
    const res = await request(app).post("/test-email").send({})
    expect(res.status).toBe(429)
  })
})

describe("authenticatedEmailRateLimit", () => {
  it("allows first request", async () => {
    const app = buildApp()
    const res = await request(app).post("/test-authenticated").send({})
    expect(res.status).toBe(200)
  })

  it("blocks same IP within time window", async () => {
    const app = buildApp()
    await request(app).post("/test-authenticated").send({})
    const res = await request(app).post("/test-authenticated").send({})
    expect(res.status).toBe(429)
    expect(res.body.code).toBe("EMAIL_SEND_RATE_LIMITED")
  })
})
