import { Op } from "sequelize"
import request from "supertest"
import { verifyJwt } from "../../utils/jwt"
import { createApp } from "../../app"
import { Profile } from "../../models/profile.model"
import { Follow } from "../../models/follow.model"

jest.mock("../../models/profile.model", () => ({
  Profile: {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
    findAll: jest.fn(),
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
const mockVerifyJwt = verifyJwt as jest.MockedFunction<typeof verifyJwt>

const mockedProfile = Profile as jest.Mocked<typeof Profile>
const mockedFollow = Follow as jest.Mocked<typeof Follow>
const app = createApp()

const PROFILE_UUID = "11111111-1111-1111-1111-111111111111"
const FOLLOWER_UUID = "22222222-2222-2222-2222-222222222222"
const FOLLOWING_UUID = "33333333-3333-3333-3333-333333333333"

const MOCK_PROFILE = {
  profileId: PROFILE_UUID,
  displayName: "Aaron Grod",
  bio: "Software Engineer",
  avatarId: "azdazd-azdazd-azd",
  followersCount: 10,
  followingCount: 5,
  update: jest.fn(),
  destroy: jest.fn(),
  toJSON: () => ({
    profileId: PROFILE_UUID,
    displayName: "Aaron Grod",
    bio: "Software Engineer",
    avatarId: "qsdqsds-qzdqzd-qzd",
    followersCount: 10,
    followingCount: 5,
  }),
}

beforeEach(() => {
  jest.clearAllMocks()
  mockVerifyJwt.mockReturnValue({ sub: PROFILE_UUID, role: "user" })
})

// ─── GET /profiles/:profileId ────────────────────────────────────────────────────────
describe("GET /profiles/:profileId", () => {
  it("returns a profile by profileId", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(MOCK_PROFILE)

    const res = await request(app)
      .get(`/profiles/${PROFILE_UUID}`)
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        profileId: PROFILE_UUID,
        displayName: "Aaron Grod",
      }),
    })
  })

  it("returns 404 for an unknown profileId", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(null)

    const res = await request(app)
      .get(`/profiles/${PROFILE_UUID}`)
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(404)
    expect(res.body.message).toBe("Profile not found")
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).get(`/profiles/${PROFILE_UUID}`)
    expect(res.status).toBe(401)
  })
})

// ─── GET /profiles/:profileId/followers ──────────────────────────────────────────────
describe("GET /profiles/:profileId/followers", () => {
  it("returns followers list", async () => {
    ;(mockedProfile.sequelize!.query as jest.Mock)
      .mockResolvedValueOnce([{ id: FOLLOWER_UUID }])
      .mockResolvedValueOnce({ count: 1 })

    const res = await request(app)
      .get(`/profiles/${PROFILE_UUID}/followers`)
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      data: { count: 1, followers: [FOLLOWER_UUID] },
    })
  })
})

// ─── GET /profiles/:profileId/following ──────────────────────────────────────────────
describe("GET /profiles/:profileId/following", () => {
  it("returns following list", async () => {
    ;(mockedProfile.sequelize!.query as jest.Mock)
      .mockResolvedValueOnce([{ id: FOLLOWING_UUID }])
      .mockResolvedValueOnce({ count: 1 })

    const res = await request(app)
      .get(`/profiles/${PROFILE_UUID}/following`)
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      data: { count: 1, following: [FOLLOWING_UUID] },
    })
  })
})

// ─── POST /profiles ───────────────────────────────────────────────────────────────
describe("POST /profiles", () => {
  it("creates a profile and returns 201", async () => {
    ;(mockedProfile.findOrCreate as jest.Mock).mockResolvedValue([MOCK_PROFILE, true])

    const res = await request(app)
      .post("/profiles")
      .set("Content-Type", "application/json")
      .set("Authorization", "Bearer fake-token")
      .send({ profileId: PROFILE_UUID, firstName: "Aaron", lastName: "Grod", username: "grodaron" })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({ profileId: PROFILE_UUID }),
    })
    expect(mockedProfile.findOrCreate).toHaveBeenCalledWith(
      expect.objectContaining({ defaults: expect.objectContaining({ profileId: PROFILE_UUID }) })
    )
  })

  it("returns 401 without auth", async () => {
    const res = await request(app)
      .post("/profiles")
      .send({ profileId: PROFILE_UUID, displayName: "Aaron Grod" })

    expect(res.status).toBe(401)
  })
})

// ─── PATCH /profiles ──────────────────────────────────────────────────────────────
describe("PATCH /profiles", () => {
  it("updates a profile and returns the updated data", async () => {
    const updatedDoc = {
      ...MOCK_PROFILE,
      bio: "Updated bio",
      toJSON: () => ({ ...MOCK_PROFILE.toJSON(), bio: "Updated bio" }),
    }

    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue({
      ...MOCK_PROFILE,
      update: jest.fn().mockResolvedValue(updatedDoc),
    })

    const res = await request(app)
      .patch("/profiles")
      .set("Content-Type", "application/json")
      .set("Authorization", "Bearer fake-token")
      .send({ bio: "Updated bio" })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("returns 404 for an unknown profileId", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(null)

    const res = await request(app)
      .patch("/profiles")
      .set("Content-Type", "application/json")
      .set("Authorization", "Bearer fake-token")
      .send({ bio: "Ghost" })

    expect(res.status).toBe(404)
    expect(res.body.message).toBe("Profile not found")
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).patch("/profiles").send({ bio: "Ghost" })
    expect(res.status).toBe(401)
  })
})

// ─── DELETE /profiles ─────────────────────────────────────────────────────────────
describe("DELETE /profiles", () => {
  it("deletes an existing profile and returns 204", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue({
      ...MOCK_PROFILE,
      destroy: jest.fn().mockResolvedValue(undefined),
    })

    const res = await request(app).delete("/profiles").set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(204)
  })

  it("returns 404 when profile not found", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(null)

    const res = await request(app).delete("/profiles").set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(404)
    expect(res.body.message).toBe("Profile not found")
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).delete("/profiles")
    expect(res.status).toBe(401)
  })
})

// ─── POST /profiles/follow ────────────────────────────────────────────────────────
describe("POST /profiles/follow", () => {
  it("creates a follow relationship", async () => {
    ;(mockedFollow.create as jest.Mock).mockResolvedValue({})
    ;(mockedProfile.increment as jest.Mock).mockResolvedValue({})
    ;(mockedProfile.sequelize!.transaction as jest.Mock).mockImplementation(
      (cb: (t: unknown) => unknown) => cb({})
    )

    const res = await request(app)
      .post("/profiles/follow")
      .set("Authorization", "Bearer fake-token")
      .send({ followingId: FOLLOWING_UUID })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
  })

  it("returns 400 when following yourself", async () => {
    const res = await request(app)
      .post("/profiles/follow")
      .set("Authorization", "Bearer fake-token")
      .send({ followingId: PROFILE_UUID })

    expect(res.status).toBe(400)
    expect(res.body.message).toBe("Cannot follow yourself")
  })

  it("returns 409 when already following", async () => {
    ;(mockedFollow.create as jest.Mock).mockRejectedValue({
      name: "SequelizeUniqueConstraintError",
    })

    const res = await request(app)
      .post("/profiles/follow")
      .set("Authorization", "Bearer fake-token")
      .send({ followingId: FOLLOWING_UUID })

    expect(res.status).toBe(409)
    expect(res.body.message).toBe("Already following")
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).post("/profiles/follow").send({ followingId: FOLLOWING_UUID })
    expect(res.status).toBe(401)
  })
})

// ─── POST /profiles/unfollow ──────────────────────────────────────────────────────
describe("POST /profiles/unfollow", () => {
  it("removes a follow relationship", async () => {
    ;(mockedFollow.findOne as jest.Mock).mockResolvedValue({ destroy: jest.fn() })
    ;(mockedProfile.decrement as jest.Mock).mockResolvedValue({})
    ;(mockedProfile.sequelize!.transaction as jest.Mock).mockImplementation(
      (cb: (t: unknown) => unknown) => cb({})
    )

    const res = await request(app)
      .post("/profiles/unfollow")
      .set("Authorization", "Bearer fake-token")
      .send({ followingId: FOLLOWING_UUID })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("returns 404 if follow relationship does not exist", async () => {
    ;(mockedFollow.findOne as jest.Mock).mockResolvedValue(null)
    ;(mockedProfile.sequelize!.transaction as jest.Mock).mockImplementation(
      (cb: (t: unknown) => unknown) => cb({})
    )

    const res = await request(app)
      .post("/profiles/unfollow")
      .set("Authorization", "Bearer fake-token")
      .send({ followingId: FOLLOWING_UUID })

    expect(res.status).toBe(404)
    expect(res.body.message).toBe("Follow relation not found")
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).post("/profiles/unfollow").send({ followingId: FOLLOWING_UUID })
    expect(res.status).toBe(401)
  })
})

// ─── GET /profiles/search ────────────────────────────────────────────────────

describe("GET /profiles/search", () => {
  it("returns matching profiles", async () => {
    ;(mockedProfile.findAndCountAll as jest.Mock).mockResolvedValue({
      count: 1,
      rows: [MOCK_PROFILE],
    })

    const res = await request(app)
      .get("/profiles/search?q=john")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      success: true,
      data: expect.objectContaining({ total: 1, page: 1 }),
    })
  })

  it("returns 400 when q is missing", async () => {
    const res = await request(app).get("/profiles/search").set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it("returns 400 when q is empty string", async () => {
    const res = await request(app)
      .get("/profiles/search?q=")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/profiles/search?q=john")
    expect(res.status).toBe(401)
  })

  it("is not caught by the /:profileId route", async () => {
    ;(mockedProfile.findAndCountAll as jest.Mock).mockResolvedValue({ count: 0, rows: [] })

    const res = await request(app)
      .get("/profiles/search?q=test")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty("total")
  })

  it("excludes the viewer from search results", async () => {
    ;(mockedProfile.findAndCountAll as jest.Mock).mockResolvedValue({ count: 0, rows: [] })

    await request(app).get("/profiles/search?q=john").set("Authorization", "Bearer fake-token")

    expect(mockedProfile.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          profileId: expect.objectContaining({
            [Op.notIn]: expect.arrayContaining([PROFILE_UUID]),
          }),
        }),
      })
    )
  })
})

// ─── GET /profiles/by-username/:username ─────────────────────────────────────

describe("GET /profiles/by-username/:username", () => {
  it("returns a profile by username", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(MOCK_PROFILE)

    const res = await request(app)
      .get("/profiles/by-username/grodaron")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(200)
    expect(res.body.data.profileId).toBe(PROFILE_UUID)
  })

  it("returns 404 for unknown username", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(null)

    const res = await request(app)
      .get("/profiles/by-username/unknown")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(404)
    expect(res.body.message).toBe("Profile not found")
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).get("/profiles/by-username/grodaron")
    expect(res.status).toBe(401)
  })
})

// ─── GET /profiles/:profileId/is-following ───────────────────────────────────

describe("GET /profiles/:profileId/is-following", () => {
  it("returns true when following", async () => {
    ;(mockedFollow.findOne as jest.Mock).mockResolvedValue({ id: "follow-1" })

    const res = await request(app)
      .get(`/profiles/${FOLLOWING_UUID}/is-following`)
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(200)
    expect(res.body.data.isFollowing).toBe(true)
  })

  it("returns false when not following", async () => {
    ;(mockedFollow.findOne as jest.Mock).mockResolvedValue(null)

    const res = await request(app)
      .get(`/profiles/${FOLLOWING_UUID}/is-following`)
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(200)
    expect(res.body.data.isFollowing).toBe(false)
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).get(`/profiles/${FOLLOWING_UUID}/is-following`)
    expect(res.status).toBe(401)
  })
})

// ─── GET /profiles/batch ─────────────────────────────────────────────────────

describe("GET /profiles/batch", () => {
  it("returns profiles by ids", async () => {
    ;(mockedProfile.findAll as jest.Mock).mockResolvedValue([MOCK_PROFILE])

    const res = await request(app).get(`/profiles/batch?ids=${PROFILE_UUID}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].profileId).toBe(PROFILE_UUID)
  })

  it("returns empty array for empty ids", async () => {
    const res = await request(app).get("/profiles/batch?ids=")

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

// ─── Error handling ──────────────────────────────────────────────────────────

describe("profile controller error handling", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  it("returns 500 when getProfile throws", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockRejectedValue(new Error("db error"))

    const res = await request(app)
      .get(`/profiles/${PROFILE_UUID}`)
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(500)
  })

  it("returns 500 when getProfileByUsername throws", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockRejectedValue(new Error("db error"))

    const res = await request(app)
      .get("/profiles/by-username/grodaron")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(500)
  })

  it("returns 500 when updateProfile throws", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockRejectedValue(new Error("db error"))

    const res = await request(app)
      .patch("/profiles")
      .set("Content-Type", "application/json")
      .set("Authorization", "Bearer fake-token")
      .send({ bio: "test" })

    expect(res.status).toBe(500)
  })

  it("returns 500 when deleteProfile throws", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockRejectedValue(new Error("db error"))

    const res = await request(app).delete("/profiles").set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(500)
  })

  it("returns 500 when follow throws non-unique error", async () => {
    ;(mockedFollow.create as jest.Mock).mockRejectedValue(new Error("unexpected"))

    const res = await request(app)
      .post("/profiles/follow")
      .set("Authorization", "Bearer fake-token")
      .send({ followingId: FOLLOWING_UUID })

    expect(res.status).toBe(500)
  })

  it("returns 500 when unfollow throws", async () => {
    ;(mockedFollow.findOne as jest.Mock).mockRejectedValue(new Error("db error"))

    const res = await request(app)
      .post("/profiles/unfollow")
      .set("Authorization", "Bearer fake-token")
      .send({ followingId: FOLLOWING_UUID })

    expect(res.status).toBe(500)
  })

  it("returns 500 when getFollowers throws", async () => {
    ;(mockedProfile.sequelize!.query as jest.Mock).mockRejectedValue(new Error("db error"))

    const res = await request(app)
      .get(`/profiles/${PROFILE_UUID}/followers`)
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(500)
  })

  it("returns 500 when getFollowing throws", async () => {
    ;(mockedProfile.sequelize!.query as jest.Mock).mockRejectedValue(new Error("db error"))

    const res = await request(app)
      .get(`/profiles/${PROFILE_UUID}/following`)
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(500)
  })

  it("returns 500 when isFollowing throws", async () => {
    ;(mockedFollow.findOne as jest.Mock).mockRejectedValue(new Error("db error"))

    const res = await request(app)
      .get(`/profiles/${FOLLOWING_UUID}/is-following`)
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(500)
  })

  it("returns 500 when batchGet throws", async () => {
    ;(mockedProfile.findAll as jest.Mock).mockRejectedValue(new Error("db error"))

    const res = await request(app).get(`/profiles/batch?ids=${PROFILE_UUID}`)

    expect(res.status).toBe(500)
  })

  it("returns 500 when search throws", async () => {
    ;(mockedProfile.findAndCountAll as jest.Mock).mockRejectedValue(new Error("db error"))

    const res = await request(app)
      .get("/profiles/search?q=john")
      .set("Authorization", "Bearer fake-token")

    expect(res.status).toBe(500)
  })

  it("returns 500 when createProfile throws", async () => {
    ;(mockedProfile.findOrCreate as jest.Mock).mockRejectedValue(new Error("db error"))

    const res = await request(app)
      .post("/profiles")
      .set("Content-Type", "application/json")
      .set("Authorization", "Bearer fake-token")
      .send({ username: "test" })

    expect(res.status).toBe(500)
  })
})
