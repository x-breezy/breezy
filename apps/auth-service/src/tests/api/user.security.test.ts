import express, { type Request, type Response, type NextFunction } from "express"
import request from "supertest"
import { createUserRouter } from "../../routes/user.route"
import UserController from "../../controllers/user.controller"
import { verifyToken } from "../../utils/jwt.util"
import type { Role } from "../../constants/roles"

jest.mock("../../utils/jwt.util")
const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>

const USER_ID = "11111111-1111-1111-1111-111111111111"
const OTHER_ID = "22222222-2222-2222-2222-222222222222"
const ADMIN_ID = "00000000-0000-0000-0000-000000000000"

const mockService = {
  isEmailAndUsernameTaken: jest.fn(),
  addUser: jest.fn(),
  getUser: jest.fn(),
  updatePassword: jest.fn(),
  searchByUsername: jest.fn(),
  banUser: jest.fn(),
}

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use("/users", createUserRouter(new UserController(mockService as never)))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ success: false, error: "Internal server error" })
  })
  return app
}

const app = buildApp()

beforeEach(() => {
  jest.clearAllMocks()
  mockVerifyToken.mockReturnValue({ sub: USER_ID, role: "user" as Role, jti: "x" })
})

// ── POST /users ───────────────────────────────────────────────────────────────

describe("POST /users", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(app).post("/users").send({})
    expect(res.status).toBe(401)
    expect(mockService.addUser).not.toHaveBeenCalled()
  })

  it("returns 403 for non-admin (user role lacks user:create)", async () => {
    const res = await request(app)
      .post("/users")
      .set("Authorization", "Bearer fake-token")
      .send({ username: "alice", email: "alice@example.com", password: "securepass" })
    expect(res.status).toBe(403)
    expect(mockService.addUser).not.toHaveBeenCalled()
  })

  it("rejects missing fields with 400 for admin", async () => {
    mockVerifyToken.mockReturnValueOnce({ sub: ADMIN_ID, role: "admin" as Role, jti: "x" })
    const res = await request(app).post("/users").set("Authorization", "Bearer fake-token").send({})
    expect(res.status).toBe(400)
  })

  it("rejects invalid email with 400 for admin", async () => {
    mockVerifyToken.mockReturnValueOnce({ sub: ADMIN_ID, role: "admin" as Role, jti: "x" })
    const res = await request(app)
      .post("/users")
      .set("Authorization", "Bearer fake-token")
      .send({ username: "alice", email: "not-an-email", password: "securepass" })
    expect(res.status).toBe(400)
  })

  it("rejects password shorter than 8 chars with 400 for admin", async () => {
    mockVerifyToken.mockReturnValueOnce({ sub: ADMIN_ID, role: "admin" as Role, jti: "x" })
    const res = await request(app)
      .post("/users")
      .set("Authorization", "Bearer fake-token")
      .send({ username: "alice", email: "alice@example.com", password: "short" })
    expect(res.status).toBe(400)
  })

  it("returns 409 when email or username is taken", async () => {
    mockService.isEmailAndUsernameTaken.mockResolvedValue({
      emailTaken: true,
      usernameTaken: false,
    })
    mockVerifyToken.mockReturnValueOnce({ sub: ADMIN_ID, role: "admin" as Role, jti: "x" })
    const res = await request(app)
      .post("/users")
      .set("Authorization", "Bearer fake-token")
      .send({ username: "alice", email: "alice@example.com", password: "securepass" })
    expect(res.status).toBe(409)
    expect(mockService.addUser).not.toHaveBeenCalled()
  })

  it("returns 201 when admin creates a user successfully", async () => {
    mockService.isEmailAndUsernameTaken.mockResolvedValue({
      emailTaken: false,
      usernameTaken: false,
    })
    mockService.addUser.mockResolvedValue({
      id: USER_ID,
      username: "alice",
      email: "alice@example.com",
    })
    mockVerifyToken.mockReturnValueOnce({ sub: ADMIN_ID, role: "admin" as Role, jti: "x" })
    const res = await request(app)
      .post("/users")
      .set("Authorization", "Bearer fake-token")
      .send({ username: "alice", email: "alice@example.com", password: "securepass" })
    expect(res.status).toBe(201)
  })
})

// ── GET /users/:id ────────────────────────────────────────────────────────────

describe("GET /users/:id", () => {
  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(app).get(`/users/${USER_ID}`)
    expect(res.status).toBe(401)
    expect(mockService.getUser).not.toHaveBeenCalled()
  })

  it("returns 403 when caller has no role (visitor - lacks user:read)", async () => {
    mockVerifyToken.mockReturnValueOnce({
      sub: USER_ID,
      role: undefined as unknown as Role,
      jti: "x",
    })
    const res = await request(app)
      .get(`/users/${USER_ID}`)
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(403)
    expect(mockService.getUser).not.toHaveBeenCalled()
  })

  it("returns 403 when caller is user (lacks user:read)", async () => {
    const res = await request(app)
      .get(`/users/${USER_ID}`)
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(403)
    expect(mockService.getUser).not.toHaveBeenCalled()
  })

  it("returns 400 when :id is not a UUID", async () => {
    mockVerifyToken.mockReturnValueOnce({ sub: USER_ID, role: "admin" as Role, jti: "x" })
    const res = await request(app)
      .get("/users/not-a-uuid")
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(400)
  })

  it("returns 404 when user does not exist", async () => {
    mockService.getUser.mockResolvedValue(null)
    mockVerifyToken.mockReturnValueOnce({ sub: USER_ID, role: "admin" as Role, jti: "x" })
    const res = await request(app)
      .get(`/users/${USER_ID}`)
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(404)
  })

  it("returns 200 with user data for admin with user:read", async () => {
    mockService.getUser.mockResolvedValue({ id: USER_ID, username: "alice" })
    mockVerifyToken.mockReturnValueOnce({ sub: USER_ID, role: "admin" as Role, jti: "x" })
    const res = await request(app)
      .get(`/users/${USER_ID}`)
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ id: USER_ID })
  })
})

// ── PATCH /users/:id/password ─────────────────────────────────────────────────

describe("PATCH /users/:id/password", () => {
  const validBody = { currentPassword: "oldpass123", newPassword: "newpass123" }

  it("returns 401 when Authorization header is missing", async () => {
    const res = await request(app).patch(`/users/${USER_ID}/password`).send(validBody)
    expect(res.status).toBe(401)
    expect(mockService.updatePassword).not.toHaveBeenCalled()
  })

  it("returns 403 when caller tries to change another user's password", async () => {
    mockVerifyToken.mockReturnValueOnce({ sub: OTHER_ID, role: "user" as Role, jti: "x" })
    const res = await request(app)
      .patch(`/users/${USER_ID}/password`)
      .set("Authorization", "Bearer fake-token")
      .send(validBody)
    expect(res.status).toBe(403)
    expect(mockService.updatePassword).not.toHaveBeenCalled()
  })

  it("returns 403 when :id is not a UUID", async () => {
    const res = await request(app)
      .patch("/users/not-a-uuid/password")
      .set("Authorization", "Bearer fake-token")
      .send(validBody)
    expect(res.status).toBe(403)
  })

  it("returns 400 when currentPassword is missing", async () => {
    const res = await request(app)
      .patch(`/users/${USER_ID}/password`)
      .set("Authorization", "Bearer fake-token")
      .send({ newPassword: "newpass123" })
    expect(res.status).toBe(400)
    expect(mockService.updatePassword).not.toHaveBeenCalled()
  })

  it("returns 400 when newPassword is too short", async () => {
    const res = await request(app)
      .patch(`/users/${USER_ID}/password`)
      .set("Authorization", "Bearer fake-token")
      .send({ currentPassword: "oldpass123", newPassword: "short" })
    expect(res.status).toBe(400)
  })

  it("returns 401 when current password is incorrect", async () => {
    mockService.updatePassword.mockRejectedValue(
      Object.assign(new Error("Invalid password"), { code: "INVALID_PASSWORD" })
    )
    const res = await request(app)
      .patch(`/users/${USER_ID}/password`)
      .set("Authorization", "Bearer fake-token")
      .send(validBody)
    expect(res.status).toBe(401)
  })

  it("returns 404 when user does not exist", async () => {
    mockService.updatePassword.mockRejectedValue(
      Object.assign(new Error("User not found"), { code: "USER_NOT_FOUND" })
    )
    const res = await request(app)
      .patch(`/users/${USER_ID}/password`)
      .set("Authorization", "Bearer fake-token")
      .send(validBody)
    expect(res.status).toBe(404)
  })

  it("does not expose internal error details on unexpected failure", async () => {
    mockService.updatePassword.mockRejectedValue(
      new Error("DB connection string: postgres://user:secret@host/db")
    )
    const res = await request(app)
      .patch(`/users/${USER_ID}/password`)
      .set("Authorization", "Bearer fake-token")
      .send(validBody)
    expect(res.status).toBe(500)
    expect(JSON.stringify(res.body)).not.toContain("postgres://")
    expect(JSON.stringify(res.body)).not.toContain("secret")
  })

  it("returns 200 on success", async () => {
    mockService.updatePassword.mockResolvedValue(undefined)
    const res = await request(app)
      .patch(`/users/${USER_ID}/password`)
      .set("Authorization", "Bearer fake-token")
      .send(validBody)
    expect(res.status).toBe(200)
    expect(mockService.updatePassword).toHaveBeenCalledWith(USER_ID, "oldpass123", "newpass123")
  })
})

// ── GET /users/me ──────────────────────────────────────────────────────────

describe("GET /users/me", () => {
  it("returns 200 with own profile", async () => {
    mockService.getUser.mockResolvedValue({ id: USER_ID, username: "alice", email: "alice@e.com" })
    const res = await request(app).get("/users/me").set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(200)
    expect(res.body.data.username).toBe("alice")
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/users/me")
    expect(res.status).toBe(401)
  })

  it("handles service error with 500", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    mockService.getUser.mockRejectedValue(new Error("db error"))
    const res = await request(app).get("/users/me").set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(500)
  })
})

// ── PATCH /users/:id/ban ────────────────────────────────────────────────────

describe("PATCH /users/:id/ban", () => {
  const UUID = "11111111-1111-1111-1111-111111111111"

  it("returns 200 on ban", async () => {
    mockService.banUser.mockResolvedValue({ id: UUID, isBanned: true })
    mockVerifyToken.mockReturnValueOnce({ sub: ADMIN_ID, role: "admin", jti: "x" })
    const res = await request(app)
      .patch(`/users/${UUID}/ban`)
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(200)
  })

  it("returns 403 for non-admin", async () => {
    const res = await request(app)
      .patch(`/users/${UUID}/ban`)
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(403)
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).patch(`/users/${UUID}/ban`)
    expect(res.status).toBe(401)
  })

  it("returns 404 when user not found", async () => {
    mockService.banUser.mockRejectedValue(
      Object.assign(new Error("User not found"), { code: "USER_NOT_FOUND" })
    )
    mockVerifyToken.mockReturnValueOnce({ sub: ADMIN_ID, role: "admin", jti: "x" })
    const res = await request(app)
      .patch(`/users/${UUID}/ban`)
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(404)
  })

  it("handles service error with 500", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    mockService.banUser.mockRejectedValue(new Error("db error"))
    mockVerifyToken.mockReturnValueOnce({ sub: ADMIN_ID, role: "admin", jti: "x" })
    const res = await request(app)
      .patch(`/users/${UUID}/ban`)
      .set("Authorization", "Bearer fake-token")
    expect(res.status).toBe(500)
  })
})

// ── GET /users/search ────────────────────────────────────────────────────────

describe("GET /users/search", () => {
  it("returns matching users", async () => {
    mockService.searchByUsername.mockResolvedValue({
      count: 1,
      users: [{ id: USER_ID, username: "alice" }],
    })

    const res = await request(app)
      .get("/users/search?q=alice")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({ total: 1, page: 1 }),
    })
    expect(mockService.searchByUsername).toHaveBeenCalledWith("alice", 1, 20)
  })

  it("returns 400 when q is missing", async () => {
    const res = await request(app).get("/users/search").set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(mockService.searchByUsername).not.toHaveBeenCalled()
  })

  it("returns 400 when q is empty string", async () => {
    const res = await request(app).get("/users/search?q=").set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/users/search?q=alice")
    expect(res.status).toBe(401)
  })

  it("is not caught by /:id route", async () => {
    mockService.searchByUsername.mockResolvedValue({ count: 0, users: [] })

    const res = await request(app)
      .get("/users/search?q=test")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("total")
  })
})
