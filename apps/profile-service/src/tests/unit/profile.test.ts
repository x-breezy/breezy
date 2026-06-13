import ProfileService from "../../services/profile.service"
import { Profile } from "../../models/profile.model"
import { Follow } from "../../models/follow.model"

jest.mock("../../models/profile.model", () => ({
  Profile: {
    findOne: jest.fn(),
    findOrCreate: jest.fn(),
    findAndCountAll: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
    sequelize: { transaction: jest.fn().mockImplementation((cb) => cb({})) },
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

describe("ProfileService", () => {
  let service: ProfileService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ProfileService()
  })

  describe("createProfile", () => {
    it("should create a profile", async () => {
      const input = { profileId: "profile-1", displayName: "Profile 1", bio: "Hello" }
      ;(mockedProfile.findOrCreate as jest.Mock).mockResolvedValue([input, true])

      const result = await service.createProfile(input as never)

      expect(mockedProfile.findOrCreate).toHaveBeenCalledWith({
        where: { profileId: input.profileId },
        defaults: input,
      })
      expect(result).toEqual(input)
    })
  })

  describe("getProfile", () => {
    it("should return a profile", async () => {
      const profile = { profileId: "profile-1" }
      ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(profile)

      const result = await service.getProfile("profile-1")

      expect(mockedProfile.findOne).toHaveBeenCalledWith({ where: { profileId: "profile-1" } })
      expect(result).toEqual(profile)
    })

    it("should return null if profile not found", async () => {
      ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(null)
      const result = await service.getProfile("non-existent")
      expect(result).toBeNull()
    })
  })

  describe("updateProfile", () => {
    it("should update and return profile", async () => {
      const updateMock = jest.fn().mockResolvedValue({ profileId: "profile-1", bio: "Updated" })
      const profileDoc = { profileId: "profile-1", update: updateMock }
      ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(profileDoc)

      const result = await service.updateProfile("profile-1", { bio: "Updated" })

      expect(mockedProfile.findOne).toHaveBeenCalledWith({ where: { profileId: "profile-1" } })
      expect(updateMock).toHaveBeenCalledWith({ bio: "Updated" })
      expect(result).toEqual({ profileId: "profile-1", bio: "Updated" })
    })

    it("should return null if profile not found", async () => {
      ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(null)
      const result = await service.updateProfile("missing", { bio: "Updated" })
      expect(result).toBeNull()
    })
  })

  describe("deleteProfile", () => {
    it("should destroy profile and return true", async () => {
      const destroyMock = jest.fn().mockResolvedValue(true)
      const profileDoc = { profileId: "profile-1", destroy: destroyMock }
      ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(profileDoc)

      const result = await service.deleteProfile("profile-1")

      expect(mockedProfile.findOne).toHaveBeenCalledWith({ where: { profileId: "profile-1" } })
      expect(destroyMock).toHaveBeenCalled()
      expect(result).toBe(true)
    })

    it("should return false if profile not found", async () => {
      ;(mockedProfile.findOne as jest.Mock).mockResolvedValue(null)
      const result = await service.deleteProfile("missing")
      expect(result).toBe(false)
    })
  })

  describe("follow", () => {
    it("should create follow and increment counts", async () => {
      ;(mockedFollow.create as jest.Mock).mockResolvedValue({})
      ;(mockedProfile.increment as jest.Mock).mockResolvedValue({})
      ;(mockedProfile.sequelize!.transaction as jest.Mock).mockImplementation((cb) => cb({}))

      await service.follow("follower-1", "following-1")

      expect(mockedFollow.create).toHaveBeenCalledWith(
        { followerId: "follower-1", followingId: "following-1" },
        { transaction: {} }
      )
      expect(mockedProfile.increment).toHaveBeenCalledWith("followingCount", {
        where: { profileId: "follower-1" },
        transaction: {},
      })
      expect(mockedProfile.increment).toHaveBeenCalledWith("followersCount", {
        where: { profileId: "following-1" },
        transaction: {},
      })
    })
  })

  describe("unfollow", () => {
    it("should destroy follow and decrement counts", async () => {
      const destroyMock = jest.fn().mockResolvedValue(true)
      const followDoc = { destroy: destroyMock }
      ;(mockedFollow.findOne as jest.Mock).mockResolvedValue(followDoc)
      ;(mockedProfile.decrement as jest.Mock).mockResolvedValue({})
      ;(mockedProfile.sequelize!.transaction as jest.Mock).mockImplementation((cb) => cb({}))

      const result = await service.unfollow("follower-1", "following-1")

      expect(mockedFollow.findOne).toHaveBeenCalledWith({
        where: { followerId: "follower-1", followingId: "following-1" },
        transaction: {},
      })
      expect(destroyMock).toHaveBeenCalledWith({ transaction: {} })
      expect(mockedProfile.decrement).toHaveBeenCalledWith("followingCount", {
        where: { profileId: "follower-1" },
        transaction: {},
      })
      expect(mockedProfile.decrement).toHaveBeenCalledWith("followersCount", {
        where: { profileId: "following-1" },
        transaction: {},
      })
      expect(result).toBe(true)
    })

    it("should return false if follow not found", async () => {
      ;(mockedFollow.findOne as jest.Mock).mockResolvedValue(null)
      ;(mockedProfile.sequelize!.transaction as jest.Mock).mockImplementation((cb) => cb({}))
      const result = await service.unfollow("follower-1", "following-1")
      expect(result).toBe(false)
    })
  })

  describe("getFollowers", () => {
    it("should return followers list", async () => {
      const makeFollow = (followerId: string) => ({
        get: (key: string) => (key === "followerId" ? followerId : undefined),
      })
      ;(mockedFollow.findAll as jest.Mock).mockResolvedValue([
        makeFollow("follower-1"),
        makeFollow("follower-2"),
      ])
      ;(mockedFollow.count as jest.Mock).mockResolvedValue(2)

      const result = await service.getFollowers("profile-1")

      expect(mockedFollow.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { followingId: "profile-1" } })
      )
      expect(mockedFollow.count).toHaveBeenCalledWith({ where: { followingId: "profile-1" } })
      expect(result).toEqual({ count: 2, followers: ["follower-1", "follower-2"] })
    })

    it("should return empty list when no followers", async () => {
      ;(mockedFollow.findAll as jest.Mock).mockResolvedValue([])
      ;(mockedFollow.count as jest.Mock).mockResolvedValue(0)

      const result = await service.getFollowers("profile-1")

      expect(result).toEqual({ count: 0, followers: [] })
    })
  })

  describe("getFollowing", () => {
    it("should return following list", async () => {
      const makeFollow = (followingId: string) => ({
        get: (key: string) => (key === "followingId" ? followingId : undefined),
      })
      ;(mockedFollow.findAll as jest.Mock).mockResolvedValue([makeFollow("following-1")])
      ;(mockedFollow.count as jest.Mock).mockResolvedValue(1)

      const result = await service.getFollowing("profile-1")

      expect(mockedFollow.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { followerId: "profile-1" } })
      )
      expect(mockedFollow.count).toHaveBeenCalledWith({ where: { followerId: "profile-1" } })
      expect(result).toEqual({ count: 1, following: ["following-1"] })
    })

    it("should return empty list when following no one", async () => {
      ;(mockedFollow.findAll as jest.Mock).mockResolvedValue([])
      ;(mockedFollow.count as jest.Mock).mockResolvedValue(0)

      const result = await service.getFollowing("profile-1")

      expect(result).toEqual({ count: 0, following: [] })
    })
  })

  describe("search", () => {
    it("returns matching profiles with count", async () => {
      ;(mockedProfile.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 1,
        rows: [{ profileId: "profile-1", firstName: "John", lastName: "Doe" }],
      })

      const result = await service.search("john", 1, 20)

      expect(mockedProfile.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20, offset: 0 })
      )
      expect(result.count).toBe(1)
      expect(result.profiles).toHaveLength(1)
    })

    it("computes offset correctly for page > 1", async () => {
      ;(mockedProfile.findAndCountAll as jest.Mock).mockResolvedValue({ count: 0, rows: [] })

      await service.search("jane", 3, 10)

      expect(mockedProfile.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ offset: 20 })
      )
    })

    it("returns empty result when no match", async () => {
      ;(mockedProfile.findAndCountAll as jest.Mock).mockResolvedValue({ count: 0, rows: [] })

      const result = await service.search("noresult", 1, 20)

      expect(result).toEqual({ count: 0, profiles: [] })
    })
  })
})
