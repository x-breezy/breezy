import express, { type Request, type Response, type NextFunction } from "express"
import request from "supertest"
import { createProfileRouter } from "../../routes/profile.route"
import { verifyJwt } from "../../utils/jwt"
import { Profile } from "../../models/profile.model"
import { publish } from "../../clients/rabbitmq"

jest.mock("../../models/profile.model", () => ({
  Profile: {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
    findAndCountAll: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    sequelize: {
      transaction: jest.fn().mockImplementation((cb: (t: unknown) => unknown) => cb({})),
      query: jest.fn(),
    },
  },
}))

jest.mock("../../models/follow.model", () => ({
  Follow: {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    count: jest.fn(),
  },
}))

jest.mock("../../utils/jwt")
jest.mock("../../clients/rabbitmq", () => ({ publish: jest.fn() }))

const mockVerifyJwt = verifyJwt as jest.MockedFunction<typeof verifyJwt>

const ALICE_ID = "11111111-1111-1111-1111-111111111111"
const BOB_ID = "22222222-2222-2222-2222-222222222222"

const MOCK_PROFILE = {
  profileId: ALICE_ID,
  displayName: "Alice",
  bio: "Hello",
  avatarId: null,
  followersCount: 0,
  followingCount: 0,
  update: jest.fn(),
  destroy: jest.fn(),
  toJSON: () => ({
    profileId: ALICE_ID,
    displayName: "Alice",
    bio: "Hello",
    avatarId: null,
    followersCount: 0,
    followingCount: 0,
  }),
}

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use("/profiles", createProfileRouter())
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ success: false, error: "Internal server error" })
  })
  return app
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("profile security", () => {
  describe("GET /profiles/:profileId", () => {
    it("returns 401 when Authorization header is missing", async () => {
      const res = await request(buildApp()).get(`/profiles/${ALICE_ID}`)
      expect(res.status).toBe(401)
    })

    it("returns 401 when JWT is invalid", async () => {
      mockVerifyJwt.mockImplementation(() => {
        throw new Error("Invalid token")
      })

      const res = await request(buildApp())
        .get(`/profiles/${ALICE_ID}`)
        .set("Authorization", "Bearer bad-token")

      expect(res.status).toBe(401)
    })
  })

  describe("PATCH /profiles", () => {
    it("returns 401 when Authorization header is missing", async () => {
      const res = await request(buildApp()).patch("/profiles").send({ bio: "Updated bio" })
      expect(res.status).toBe(401)
    })

    it("returns 401 when JWT is invalid", async () => {
      mockVerifyJwt.mockImplementation(() => {
        throw new Error("Invalid token")
      })

      const res = await request(buildApp())
        .patch("/profiles")
        .set("Authorization", "Bearer bad-token")
        .send({ bio: "Hacked bio" })

      expect(res.status).toBe(401)
    })
  })

  describe("DELETE /profiles", () => {
    it("returns 401 when Authorization header is missing", async () => {
      const res = await request(buildApp()).delete("/profiles")
      expect(res.status).toBe(401)
    })

    it("returns 401 when JWT is invalid", async () => {
      mockVerifyJwt.mockImplementation(() => {
        throw new Error("Invalid token")
      })

      const res = await request(buildApp())
        .delete("/profiles")
        .set("Authorization", "Bearer bad-token")

      expect(res.status).toBe(401)
    })
  })
})
