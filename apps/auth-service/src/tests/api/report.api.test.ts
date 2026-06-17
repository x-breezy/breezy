import express, { type Request, type Response, type NextFunction } from "express"
import request from "supertest"
import { createReportRouter } from "../../routes/report.route"
import ReportController from "../../controllers/report.controller"
import { verifyToken } from "../../utils/jwt.util"

jest.mock("../../utils/jwt.util")
jest.mock("../../clients/rabbitmq", () => ({ publish: jest.fn() }))

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>

const mockReportService = {
  createReport: jest.fn(),
  resolveReport: jest.fn(),
}

const controller = new ReportController(mockReportService as never)

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use("/reports", createReportRouter(controller))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ success: false, error: "Internal server error" })
  })
  return app
}

const app = buildApp()
const USER_ID = "11111111-1111-1111-1111-111111111111"
const ADMIN_ID = "00000000-0000-0000-0000-000000000000"

beforeEach(() => {
  jest.clearAllMocks()
})

describe("POST /reports", () => {
  it("returns 201 when report is created", async () => {
    mockVerifyToken.mockReturnValue({
      sub: USER_ID,
      role: "user",
      jti: "jti-1",
    } as never)
    mockReportService.createReport.mockResolvedValue({
      id: "report-1",
      reporterId: USER_ID,
      reportedUserId: "user-2",
      reason: "Spam",
      status: "pending",
    })

    const res = await request(app)
      .post("/reports")
      .set("Authorization", "Bearer valid-token")
      .send({ reportedUserId: "22222222-2222-2222-2222-222222222222", reason: "Spam" })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toMatchObject({ id: "report-1", reason: "Spam" })
  })

  it("returns 401 without auth header", async () => {
    const res = await request(app)
      .post("/reports")
      .send({ reportedUserId: "22222222-2222-2222-2222-222222222222", reason: "Spam" })

    expect(res.status).toBe(401)
    expect(mockReportService.createReport).not.toHaveBeenCalled()
  })

  it("returns 400 with invalid body", async () => {
    mockVerifyToken.mockReturnValue({
      sub: USER_ID,
      role: "user",
      jti: "jti-1",
    } as never)

    const res = await request(app)
      .post("/reports")
      .set("Authorization", "Bearer valid-token")
      .send({ reason: "Spam" })

    expect(res.status).toBe(400)
    expect(mockReportService.createReport).not.toHaveBeenCalled()
  })

  it("returns 400 with invalid UUID", async () => {
    mockVerifyToken.mockReturnValue({
      sub: USER_ID,
      role: "user",
      jti: "jti-1",
    } as never)

    const res = await request(app)
      .post("/reports")
      .set("Authorization", "Bearer valid-token")
      .send({ reportedUserId: "not-a-uuid", reason: "Spam" })

    expect(res.status).toBe(400)
  })

  it("returns 400 with empty reason", async () => {
    mockVerifyToken.mockReturnValue({
      sub: USER_ID,
      role: "user",
      jti: "jti-1",
    } as never)

    const res = await request(app)
      .post("/reports")
      .set("Authorization", "Bearer valid-token")
      .send({ reportedUserId: "22222222-2222-2222-2222-222222222222", reason: "" })

    expect(res.status).toBe(400)
  })
})

describe("PATCH /reports/:id/resolve", () => {
  it("returns 200 when report is resolved", async () => {
    mockVerifyToken.mockReturnValue({
      sub: ADMIN_ID,
      role: "admin",
      jti: "jti-1",
    } as never)
    mockReportService.resolveReport.mockResolvedValue(undefined)

    const res = await request(app)
      .patch("/reports/33333333-3333-3333-3333-333333333333/resolve")
      .set("Authorization", "Bearer admin-token")

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(mockReportService.resolveReport).toHaveBeenCalledWith("33333333-3333-3333-3333-333333333333", ADMIN_ID)
  })

  it("returns 401 without auth header", async () => {
    const res = await request(app).patch("/reports/report-1/resolve")

    expect(res.status).toBe(401)
    expect(mockReportService.resolveReport).not.toHaveBeenCalled()
  })

  it("returns 403 for user without report:resolve", async () => {
    mockVerifyToken.mockReturnValue({
      sub: USER_ID,
      role: "user",
      jti: "jti-1",
    } as never)

    const res = await request(app)
      .patch("/reports/report-1/resolve")
      .set("Authorization", "Bearer user-token")

    expect(res.status).toBe(403)
    expect(mockReportService.resolveReport).not.toHaveBeenCalled()
  })

  it("returns 404 from controller when report not found", async () => {
    mockVerifyToken.mockReturnValue({
      sub: ADMIN_ID,
      role: "admin",
      jti: "jti-1",
    } as never)
    mockReportService.resolveReport.mockRejectedValue(
      Object.assign(new Error("Report not found"), { code: "REPORT_NOT_FOUND" })
    )

    const res = await request(app)
      .patch("/reports/00000000-0000-0000-0000-000000000000/resolve")
      .set("Authorization", "Bearer admin-token")

    expect(res.status).toBe(404)
    expect(res.body.message).toBe("Report not found")
  })

  it("returns 409 when report already resolved", async () => {
    mockVerifyToken.mockReturnValue({
      sub: ADMIN_ID,
      role: "admin",
      jti: "jti-1",
    } as never)
    mockReportService.resolveReport.mockRejectedValue(
      Object.assign(new Error("Report already resolved"), { code: "REPORT_ALREADY_RESOLVED" })
    )

    const res = await request(app)
      .patch("/reports/33333333-3333-3333-3333-333333333333/resolve")
      .set("Authorization", "Bearer admin-token")

    expect(res.status).toBe(409)
    expect(res.body.message).toBe("Report already resolved")
  })

  it("returns 500 on unexpected error", async () => {
    mockVerifyToken.mockReturnValue({
      sub: ADMIN_ID,
      role: "admin",
      jti: "jti-1",
    } as never)
    mockReportService.resolveReport.mockRejectedValue(new Error("DB error"))

    const res = await request(app)
      .patch("/reports/33333333-3333-3333-3333-333333333333/resolve")
      .set("Authorization", "Bearer admin-token")

    expect(res.status).toBe(500)
  })
})
