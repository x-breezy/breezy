import request from "supertest"
import { createApp } from "../../app"
import { Profile } from "../../models/profile.model"
import { Follow } from "../../models/follow.model"

jest.mock("../../models/profile.model", () => ({
  Profile: {
    create: jest.fn(),
    findOne: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
  },
}))

jest.mock("../../models/follow.model", () => ({
  Follow: {
    create: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
  },
}))

const mockedProfile = Profile as jest.Mocked<typeof Profile>
const mockedFollow = Follow as jest.Mocked<typeof Follow>
const app = createApp()

const NOW = new Date("2026-01-01T00:00:00.000Z")

const MOCK_PROFILE = {
  id: "prof-1",
  profileId: "profile-123",
  displayName: "Aaron Grod",
  bio: "Software Engineer",
  avatarUrl: "https://example.com/avatar.jpg",
  followersCount: 10,
  followingCount: 5,
  createdAt: NOW,
  updatedAt: NOW,
  update: jest.fn(),
  destroy: jest.fn(),
  toJSON: () => ({
    id: "prof-1",
    profileId: "profile-123",
    displayName: "Aaron Grod",
    bio: "Software Engineer",
    avatarUrl: "https://example.com/avatar.jpg",
    followersCount: 10,
    followingCount: 5,
    createdAt: NOW,
    updatedAt: NOW,
  }),
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET /profiles/:profileId ────────────────────────────────────────────────────────
describe("GET /profiles/:profileId", () => {
  it("returns a profile by profileId", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(MOCK_PROFILE)

    const res = await request(app).get(`/profiles/${MOCK_PROFILE.profileId}`)

    expect(res.status).toBe(200)
    expect(res.body).toEqual({
      profileId: MOCK_PROFILE.profileId,
      displayName: MOCK_PROFILE.displayName,
      bio: MOCK_PROFILE.bio,
      avatarUrl: MOCK_PROFILE.avatarUrl,
      followersCount: MOCK_PROFILE.followersCount,
      followingCount: MOCK_PROFILE.followingCount,
    })
  })

  it("returns 404 for an unknown profileId", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(null)

    const res = await request(app).get("/profiles/unknown-profile")
    expect(res.status).toBe(404)
    expect(res.body.message).toBe("Profile not found")
  })
})

// ─── GET /profiles/:profileId/relations ──────────────────────────────────────────────
describe("GET /profiles/:profileId/relations", () => {
  it("returns followers and following", async () => {
    const followers = [{ followerId: "follower-1", followingId: MOCK_PROFILE.profileId }]
    const following = [{ followerId: MOCK_PROFILE.profileId, followingId: "following-1" }]
    
    ;(mockedFollow.findAll as jest.Mock)
      .mockResolvedValueOnce(followers)
      .mockResolvedValueOnce(following)

    const followerProfiles = [{ profileId: "follower-1", displayName: "Follower 1" }]
    const followingProfiles = [{ profileId: "following-1", displayName: "Following 1" }]

    mockedProfile.findAll = jest.fn()
      .mockResolvedValueOnce(followerProfiles)
      .mockResolvedValueOnce(followingProfiles)

    const res = await request(app).get(`/profiles/${MOCK_PROFILE.profileId}/relations`)

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual({ followers: followerProfiles, following: followingProfiles })
  })
})

// ─── POST /profiles ───────────────────────────────────────────────────────────────
describe("POST /profiles", () => {
  it("creates a profile and returns 201", async () => {
    ;(mockedProfile.create as jest.Mock).mockResolvedValue(MOCK_PROFILE)

    const res = await request(app).post("/profiles").set("Content-Type", "application/json").send({
      profileId: "profile-123",
      displayName: "Aaron Grod",
    })

    expect(res.status).toBe(201)
    expect(res.body).toEqual(MOCK_PROFILE.toJSON())
    expect(mockedProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({ profileId: "profile-123", displayName: "Aaron Grod" })
    )
  })
})

// ─── PATCH /profiles ──────────────────────────────────────────────────────────────
describe("PATCH /profiles", () => {
  it("updates a profile and returns the updated data", async () => {
    const updatedDoc = {
      ...MOCK_PROFILE,
      displayName: "Aaron Grod Updated",
      toJSON: () => ({ ...MOCK_PROFILE.toJSON(), displayName: "Aaron Grod Updated" }),
    }

    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue({
      ...MOCK_PROFILE,
      update: jest.fn().mockResolvedValue(updatedDoc),
    })

    const res = await request(app)
      .patch("/profiles")
      .set("Content-Type", "application/json")
      .send({ profileId: "profile-123", displayName: "Aaron Grod Updated" })

    expect(res.status).toBe(200)
    expect(res.body.displayName).toBe("Aaron Grod Updated")
  })

  it("returns 404 for an unknown profileId", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(null)

    const res = await request(app).patch("/profiles").send({ profileId: "unknown-profile", displayName: "Ghost" })

    expect(res.status).toBe(404)
    expect(res.body.message).toBe("Profile not found")
  })
})

// ─── DELETE /profiles ─────────────────────────────────────────────────────────────
describe("DELETE /profiles", () => {
  it("deletes an existing profile and returns 204", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue({
      ...MOCK_PROFILE,
      destroy: jest.fn().mockResolvedValue(undefined),
    })

    const res = await request(app).delete("/profiles").send({ profileId: "profile-123" })
    expect(res.status).toBe(204)
  })

  it("returns 404 when profile not found", async () => {
    ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(null)

    const res = await request(app).delete("/profiles").send({ profileId: "unknown-profile" })
    expect(res.status).toBe(404)
    expect(res.body.message).toBe("Profile not found")
  })
})

// ─── POST /profiles/follow ────────────────────────────────────────────────────────
describe("POST /profiles/follow", () => {
  it("creates a follow relationship", async () => {
    ;(mockedFollow.create as jest.Mock).mockResolvedValue({})
    ;(mockedProfile.increment as jest.Mock).mockResolvedValue({})

    const res = await request(app).post("/profiles/follow").send({ followerId: "u1", followingId: "u2" })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true })
  })
})

// ─── POST /profiles/unfollow ──────────────────────────────────────────────────────
describe("POST /profiles/unfollow", () => {
  it("removes a follow relationship", async () => {
    ;(mockedFollow.findOne as jest.Mock).mockResolvedValue({ destroy: jest.fn() })
    ;(mockedProfile.decrement as jest.Mock).mockResolvedValue({})

    const res = await request(app).post("/profiles/unfollow").send({ followerId: "u1", followingId: "u2" })

    expect(res.status).toBe(200)
    expect(res.body).toEqual({ success: true })
  })

  it("returns 404 if follow relationship does not exist", async () => {
    ;(mockedFollow.findOne as jest.Mock).mockResolvedValue(null)

    const res = await request(app).post("/profiles/unfollow").send({ followerId: "u1", followingId: "u2" })

    expect(res.status).toBe(404)
    expect(res.body.message).toBe("Follow relationship not found")
  })
})
