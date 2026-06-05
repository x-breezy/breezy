import express, { type Request, type Response, type NextFunction } from "express"
import request from "supertest"
import { createUserRouter } from "../../routes/user.route"
import UserController from "../../controllers/user.controller"

const USER_ID = "11111111-1111-1111-1111-111111111111"
const OTHER_ID = "22222222-2222-2222-2222-222222222222"

const mockService = {
  isEmailAndUsernameTaken: jest.fn(),
  addUser: jest.fn(),
  getUser: jest.fn(),
  updatePassword: jest.fn(),
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

beforeEach(() => jest.clearAllMocks())

// ── POST /users ───────────────────────────────────────────────────────────────

describe("POST /users", () => {
  it("rejects missing fields with 400", async () => {
    const res = await request(app).post("/users").send({})
    expect(res.status).toBe(400)
  })

  it("rejects invalid email with 400", async () => {
    const res = await request(app)
      .post("/users")
      .send({ username: "alice", email: "not-an-email", password: "securepass" })
    expect(res.status).toBe(400)
  })

  it("rejects password shorter than 8 chars with 400", async () => {
    const res = await request(app)
      .post("/users")
      .send({ username: "alice", email: "alice@example.com", password: "short" })
    expect(res.status).toBe(400)
  })

  it("returns 409 when email or username is taken", async () => {
    mockService.isEmailAndUsernameTaken.mockResolvedValue({ emailTaken: true, usernameTaken: false })
    const res = await request(app)
      .post("/users")
      .send({ username: "alice", email: "alice@example.com", password: "securepass" })
    expect(res.status).toBe(409)
    expect(mockService.addUser).not.toHaveBeenCalled()
  })

  it("is accessible without authentication (public registration)", async () => {
    mockService.isEmailAndUsernameTaken.mockResolvedValue({ emailTaken: false, usernameTaken: false })
    mockService.addUser.mockResolvedValue({ id: USER_ID, username: "alice", email: "alice@example.com" })
    const res = await request(app)
      .post("/users")
      .send({ username: "alice", email: "alice@example.com", password: "securepass" })
    expect(res.status).toBe(201)
  })
})

// ── GET /users/:id ────────────────────────────────────────────────────────────

describe("GET /users/:id", () => {
  it("returns 401 when x-user-id header is missing", async () => {
    const res = await request(app).get(`/users/${USER_ID}`)
    expect(res.status).toBe(401)
    expect(mockService.getUser).not.toHaveBeenCalled()
  })

  it("returns 403 when caller has no roles (visitor — lacks user:read)", async () => {
    const res = await request(app)
      .get(`/users/${USER_ID}`)
      .set("x-user-id", USER_ID)
    // no x-roles → identity sets roles:[] → visitor → no user:read
    expect(res.status).toBe(403)
    expect(mockService.getUser).not.toHaveBeenCalled()
  })

  it("returns 400 when :id is not a UUID", async () => {
    const res = await request(app)
      .get("/users/not-a-uuid")
      .set("x-user-id", USER_ID)
      .set("x-roles", "user")
    expect(res.status).toBe(400)
  })

  it("returns 404 when user does not exist", async () => {
    mockService.getUser.mockResolvedValue(null)
    const res = await request(app)
      .get(`/users/${USER_ID}`)
      .set("x-user-id", USER_ID)
      .set("x-roles", "user")
    expect(res.status).toBe(404)
  })

  it("returns 200 with user data for authenticated user with user:read", async () => {
    mockService.getUser.mockResolvedValue({ id: USER_ID, username: "alice" })
    const res = await request(app)
      .get(`/users/${USER_ID}`)
      .set("x-user-id", USER_ID)
      .set("x-roles", "user")
    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ id: USER_ID })
  })
})

// ── PATCH /users/:id/password ─────────────────────────────────────────────────

describe("PATCH /users/:id/password", () => {
  const validBody = { currentPassword: "oldpass123", newPassword: "newpass123" }

  it("returns 401 when x-user-id header is missing", async () => {
    const res = await request(app).patch(`/users/${USER_ID}/password`).send(validBody)
    expect(res.status).toBe(401)
    expect(mockService.updatePassword).not.toHaveBeenCalled()
  })

  it("returns 403 when caller tries to change another user's password", async () => {
    const res = await request(app)
      .patch(`/users/${USER_ID}/password`)
      .set("x-user-id", OTHER_ID)
      .set("x-roles", "user")
      .send(validBody)
    expect(res.status).toBe(403)
    expect(mockService.updatePassword).not.toHaveBeenCalled()
  })

  it("returns 400 when :id is not a UUID", async () => {
    const res = await request(app)
      .patch("/users/not-a-uuid/password")
      .set("x-user-id", USER_ID)
      .set("x-roles", "user")
      .send(validBody)
    expect(res.status).toBe(400)
  })

  it("returns 400 when currentPassword is missing", async () => {
    const res = await request(app)
      .patch(`/users/${USER_ID}/password`)
      .set("x-user-id", USER_ID)
      .set("x-roles", "user")
      .send({ newPassword: "newpass123" })
    expect(res.status).toBe(400)
    expect(mockService.updatePassword).not.toHaveBeenCalled()
  })

  it("returns 400 when newPassword is too short", async () => {
    const res = await request(app)
      .patch(`/users/${USER_ID}/password`)
      .set("x-user-id", USER_ID)
      .set("x-roles", "user")
      .send({ currentPassword: "oldpass123", newPassword: "short" })
    expect(res.status).toBe(400)
  })

  it("returns 401 when current password is incorrect", async () => {
    mockService.updatePassword.mockRejectedValue(
      Object.assign(new Error("Invalid password"), { code: "INVALID_PASSWORD" })
    )
    const res = await request(app)
      .patch(`/users/${USER_ID}/password`)
      .set("x-user-id", USER_ID)
      .set("x-roles", "user")
      .send(validBody)
    expect(res.status).toBe(401)
  })

  it("returns 404 when user does not exist", async () => {
    mockService.updatePassword.mockRejectedValue(
      Object.assign(new Error("User not found"), { code: "USER_NOT_FOUND" })
    )
    const res = await request(app)
      .patch(`/users/${USER_ID}/password`)
      .set("x-user-id", USER_ID)
      .set("x-roles", "user")
      .send(validBody)
    expect(res.status).toBe(404)
  })

  it("does not expose internal error details on unexpected failure", async () => {
    mockService.updatePassword.mockRejectedValue(new Error("DB connection string: postgres://user:secret@host/db"))
    const res = await request(app)
      .patch(`/users/${USER_ID}/password`)
      .set("x-user-id", USER_ID)
      .set("x-roles", "user")
      .send(validBody)
    expect(res.status).toBe(500)
    expect(JSON.stringify(res.body)).not.toContain("postgres://")
    expect(JSON.stringify(res.body)).not.toContain("secret")
  })

  it("returns 200 on success", async () => {
    mockService.updatePassword.mockResolvedValue(undefined)
    const res = await request(app)
      .patch(`/users/${USER_ID}/password`)
      .set("x-user-id", USER_ID)
      .set("x-roles", "user")
      .send(validBody)
    expect(res.status).toBe(200)
    expect(mockService.updatePassword).toHaveBeenCalledWith(USER_ID, "oldpass123", "newpass123")
  })
})
