import ProfileService from "../../services/profile.service"
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

describe("ProfileService", () => {
  let service: ProfileService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ProfileService()
  })

  describe("createProfile", () => {
    it("should create a profile", async () => {
      const input = { profileId: "profile-1", displayName: "Profile 1", bio: "Hello" }
      ;(mockedProfile.create as jest.Mock).mockResolvedValue(input)

      const result = await service.createProfile(input)

      expect(mockedProfile.create).toHaveBeenCalledWith(input)
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

      await service.follow("follower-1", "following-1")

      expect(mockedFollow.create).toHaveBeenCalledWith({
        followerId: "follower-1",
        followingId: "following-1",
      })
      expect(mockedProfile.increment).toHaveBeenCalledWith("followingCount", {
        where: { profileId: "follower-1" },
      })
      expect(mockedProfile.increment).toHaveBeenCalledWith("followersCount", {
        where: { profileId: "following-1" },
      })
    })
  })

  describe("unfollow", () => {
    it("should destroy follow and decrement counts", async () => {
      const destroyMock = jest.fn().mockResolvedValue(true)
      const followDoc = { destroy: destroyMock }
      ;(mockedFollow.findOne as jest.Mock).mockResolvedValue(followDoc)
      ;(mockedProfile.decrement as jest.Mock).mockResolvedValue({})

      const result = await service.unfollow("follower-1", "following-1")

      expect(mockedFollow.findOne).toHaveBeenCalledWith({
        where: { followerId: "follower-1", followingId: "following-1" },
      })
      expect(destroyMock).toHaveBeenCalled()
      expect(mockedProfile.decrement).toHaveBeenCalledWith("followingCount", {
        where: { profileId: "follower-1" },
      })
      expect(mockedProfile.decrement).toHaveBeenCalledWith("followersCount", {
        where: { profileId: "following-1" },
      })
      expect(result).toBe(true)
    })

    it("should return false if follow not found", async () => {
      ;(mockedFollow.findOne as jest.Mock).mockResolvedValue(null)
      const result = await service.unfollow("follower-1", "following-1")
      expect(result).toBe(false)
    })
  })

  describe("getRelations", () => {
    it("should return followers and following", async () => {
      const followers = [{ followerId: "follower-1" }]
      const following = [{ followingId: "following-1" }]

      ;(mockedFollow.findAll as jest.Mock)
        .mockResolvedValueOnce(followers)
        .mockResolvedValueOnce(following)

      const result = await service.getRelations("profile-1")

      expect(mockedFollow.findAll).toHaveBeenCalledWith({ where: { followingId: "profile-1" } })
      expect(mockedFollow.findAll).toHaveBeenCalledWith({ where: { followerId: "profile-1" } })
      expect(result).toEqual({ followers, following })
    })
  })
})
