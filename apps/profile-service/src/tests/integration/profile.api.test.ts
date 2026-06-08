import request from "supertest"
import { createApp } from "../../app"
import { Profile } from "../../models/profile.model"
import { Follow } from "../../models/follow.model"

jest.mock("../../models/profile.model", () => ({
  Profile: {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    sequelize: {
      transaction: jest.fn().mockImplementation((cb: (t: unknown) => unknown) => cb({})),
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
  avatarUrl: "https://example.com/avatar.jpg",
  followersCount: 10,
  followingCount: 5,
  update: jest.fn(),
  destroy: jest.fn(),
  toJSON: () => ({
    profileId: PROFILE_UUID,
    displayName: "Aaron Grod",
    bio: "Software Engineer",
    avatarUrl: "https://example.com/avatar.jpg",
    followersCount: 10,
    followingCount: 5,
  }),
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET /profiles/:profileId ────────────────────────────────────────────────────────
describe("GET /profiles/:profileId", () => {
  it("returns a profile by profileId", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(MOCK_PROFILE)

    const res = await request(app)
      .get(`/profiles/${PROFILE_UUID}`)
      .set("x-user-id", PROFILE_UUID)
      .set("x-roles", "user")

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
      .set("x-user-id", PROFILE_UUID)
      .set("x-roles", "user")

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
    const makeFollow = (followerId: string) => ({
      get: (k: string) => (k === "followerId" ? followerId : undefined),
    })
    ;(mockedFollow.findAll as jest.Mock).mockResolvedValue([makeFollow(FOLLOWER_UUID)])
    ;(mockedFollow.count as jest.Mock).mockResolvedValue(1)

    const res = await request(app)
      .get(`/profiles/${PROFILE_UUID}/followers`)
      .set("x-user-id", PROFILE_UUID)
      .set("x-roles", "user")

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
    const makeFollow = (followingId: string) => ({
      get: (k: string) => (k === "followingId" ? followingId : undefined),
    })
    ;(mockedFollow.findAll as jest.Mock).mockResolvedValue([makeFollow(FOLLOWING_UUID)])
    ;(mockedFollow.count as jest.Mock).mockResolvedValue(1)

    const res = await request(app)
      .get(`/profiles/${PROFILE_UUID}/following`)
      .set("x-user-id", PROFILE_UUID)
      .set("x-roles", "user")

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
      .set("x-user-id", PROFILE_UUID)
      .set("x-roles", "user")
      .send({ profileId: PROFILE_UUID, firstName: "Aaron", lastName: "Grod" })

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
      .set("x-user-id", PROFILE_UUID)
      .set("x-roles", "user")
      .send({ bio: "Updated bio" })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("returns 404 for an unknown profileId", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(null)

    const res = await request(app)
      .patch("/profiles")
      .set("Content-Type", "application/json")
      .set("x-user-id", PROFILE_UUID)
      .set("x-roles", "user")
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

    const res = await request(app)
      .delete("/profiles")
      .set("x-user-id", PROFILE_UUID)
      .set("x-roles", "user")

    expect(res.status).toBe(204)
  })

  it("returns 404 when profile not found", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(null)

    const res = await request(app)
      .delete("/profiles")
      .set("x-user-id", PROFILE_UUID)
      .set("x-roles", "user")

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
      .set("x-user-id", FOLLOWER_UUID)
      .set("x-roles", "user")
      .send({ followingId: FOLLOWING_UUID })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
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
      .set("x-user-id", FOLLOWER_UUID)
      .set("x-roles", "user")
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
      .set("x-user-id", FOLLOWER_UUID)
      .set("x-roles", "user")
      .send({ followingId: FOLLOWING_UUID })

    expect(res.status).toBe(404)
    expect(res.body.message).toBe("Follow relation not found")
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).post("/profiles/unfollow").send({ followingId: FOLLOWING_UUID })
    expect(res.status).toBe(401)
  })
})
