import request from "supertest"
import { createApp } from "../../app"
import { User } from "../../models/user.model"

jest.mock("../../models/user.model", () => ({
  User: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
  },
}))

const mockedUser = User as jest.Mocked<typeof User>
const app = createApp()

const NOW = new Date("2026-01-01T00:00:00.000Z")

const MOCK_DOC = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  username: "grod_aaron",
  email: "grod.aaron@gmail.com",
  isVerified: false,
  createdAt: NOW,
  updatedAt: NOW,
  update: jest.fn(),
  toJSON: () => ({
    id: "550e8400-e29b-41d4-a716-446655440000",
    username: "grod_aaron",
    email: "grod.aaron@gmail.com",
    isVerified: false,
    createdAt: NOW,
    updatedAt: NOW,
  }),
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET / ────────────────────────────────────────────────────────────────────

describe("GET /", () => {
  it("returns status ok", async () => {
    const res = await request(app).get("/")
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ status: "ok" })
  })
})

// ─── GET /docs.json ───────────────────────────────────────────────────────────

describe("GET /docs.json", () => {
  it("returns the OpenAPI spec as JSON", async () => {
    const res = await request(app).get("/docs.json")
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty("openapi")
  })
})

// ─── POST /users ──────────────────────────────────────────────────────────────

describe("POST /users", () => {
  it("creates a user and returns metadata without passwordHash", async () => {
    ;(mockedUser.create as jest.Mock).mockResolvedValue(MOCK_DOC)

    const res = await request(app).post("/users").set("Content-Type", "application/json").send({
      username: "grod_aaron",
      email: "grod.aaron@gmail.com",
      passwordHash: "$2b$10$abcdefghijklmnopqrstuuVwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12",
    })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      message: "User added successfully",
      data: expect.objectContaining({
        id: MOCK_DOC.id,
        username: "grod_aaron",
        email: "grod.aaron@gmail.com",
        isVerified: false,
        createdAt: NOW.toISOString(),
      }),
    })
    expect(res.body.data.passwordHash).toBeUndefined()
    expect(mockedUser.create).toHaveBeenCalledWith(
      expect.objectContaining({ username: "grod_aaron", email: "grod.aaron@gmail.com" })
    )
  })

  it("rejects invalid email with 400", async () => {
    const res = await request(app)
      .post("/users")
      .set("Content-Type", "application/json")
      .send({ username: "grod_aaron", email: "not-an-email", passwordHash: "x" })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe("Validation error")
    expect(mockedUser.create).not.toHaveBeenCalled()
  })

  it("rejects username shorter than 3 chars with 400", async () => {
    const res = await request(app)
      .post("/users")
      .set("Content-Type", "application/json")
      .send({ username: "ab", email: "grod.aaron@gmail.com", passwordHash: "x" })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe("Validation error")
    expect(mockedUser.create).not.toHaveBeenCalled()
  })

  it("rejects empty body with 400", async () => {
    const res = await request(app).post("/users").set("Content-Type", "application/json").send({})

    expect(res.status).toBe(400)
    expect(mockedUser.create).not.toHaveBeenCalled()
  })
})

// ─── GET /users/:id ───────────────────────────────────────────────────────────

describe("GET /users/:id", () => {
  it("returns a user by id", async () => {
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue(MOCK_DOC)

    const res = await request(app).get(`/users/${MOCK_DOC.id}`)

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      message: "User retrieved successfully",
      data: expect.objectContaining({ id: MOCK_DOC.id, username: "grod_aaron" }),
    })
    expect(res.body.data.passwordHash).toBeUndefined()
  })

  it("returns 404 for an unknown id", async () => {
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue(null)

    const res = await request(app).get("/users/550e8400-e29b-41d4-a716-000000000000")
    expect(res.status).toBe(404)
    expect(res.body.message).toBe("User not found")
  })

  it("rejects a malformed uuid with 400", async () => {
    const res = await request(app).get("/users/not-a-uuid")
    expect(res.status).toBe(400)
    expect(res.body.message).toBe("Validation error")
    expect(mockedUser.findByPk).not.toHaveBeenCalled()
  })
})

// ─── GET /users/email/:email ──────────────────────────────────────────────────

describe("GET /users/email/:email", () => {
  it("returns a user by email", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(MOCK_DOC)

    const res = await request(app).get("/users/email/grod.aaron@gmail.com")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      message: "User retrieved successfully",
      data: expect.objectContaining({ email: "grod.aaron@gmail.com" }),
    })
    expect(res.body.data.passwordHash).toBeUndefined()
  })

  it("returns 404 for an unknown email", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(null)

    const res = await request(app).get("/users/email/unknown@gmail.com")
    expect(res.status).toBe(404)
    expect(res.body.message).toBe("User not found")
  })

  it("rejects an invalid email with 400", async () => {
    const res = await request(app).get("/users/email/not-an-email")
    expect(res.status).toBe(400)
    expect(res.body.message).toBe("Validation error")
    expect(mockedUser.findOne).not.toHaveBeenCalled()
  })
})

// ─── PATCH /users/:id ─────────────────────────────────────────────────────────

describe("PATCH /users/:id", () => {
  it("updates a user and returns updated data", async () => {
    const updatedDoc = {
      ...MOCK_DOC,
      username: "aaron_updated",
      toJSON: () => ({ ...MOCK_DOC.toJSON(), username: "aaron_updated" }),
    }

    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue({
      ...MOCK_DOC,
      update: jest.fn().mockResolvedValue(updatedDoc),
    })

    const res = await request(app)
      .patch(`/users/${MOCK_DOC.id}`)
      .set("Content-Type", "application/json")
      .send({ username: "aaron_updated" })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      message: "User updated successfully",
      data: expect.objectContaining({ username: "aaron_updated" }),
    })
    expect(res.body.data.passwordHash).toBeUndefined()
  })

  it("returns 404 for an unknown id", async () => {
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue(null)

    const res = await request(app)
      .patch("/users/550e8400-e29b-41d4-a716-000000000000")
      .send({ username: "ghost" })

    expect(res.status).toBe(404)
    expect(res.body.message).toBe("User not found")
  })

  it("rejects an empty body with 400", async () => {
    const res = await request(app)
      .patch(`/users/${MOCK_DOC.id}`)
      .set("Content-Type", "application/json")
      .send({})

    expect(res.status).toBe(400)
    expect(res.body.message).toBe("Validation error")
    expect(mockedUser.findByPk).not.toHaveBeenCalled()
  })

  it("rejects a malformed uuid with 400", async () => {
    const res = await request(app).patch("/users/not-a-uuid").send({ username: "aaron_updated" })

    expect(res.status).toBe(400)
    expect(mockedUser.findByPk).not.toHaveBeenCalled()
  })
})

// ─── DELETE /users/:id ────────────────────────────────────────────────────────

describe("DELETE /users/:id", () => {
  it("deletes an existing user and returns 204", async () => {
    ;(mockedUser.destroy as jest.Mock).mockResolvedValue(1)

    const res = await request(app).delete(`/users/${MOCK_DOC.id}`)
    expect(res.status).toBe(204)
  })

  it("returns 404 when nothing matched", async () => {
    ;(mockedUser.destroy as jest.Mock).mockResolvedValue(0)

    const res = await request(app).delete("/users/550e8400-e29b-41d4-a716-000000000000")
    expect(res.status).toBe(404)
    expect(res.body.message).toBe("User not found")
  })

  it("rejects a malformed uuid with 400", async () => {
    const res = await request(app).delete("/users/not-a-uuid")
    expect(res.status).toBe(400)
    expect(mockedUser.destroy).not.toHaveBeenCalled()
  })
})
