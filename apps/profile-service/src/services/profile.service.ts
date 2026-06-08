import { Profile, CreateProfileInput, UpdateProfileInput } from "../models/profile.model"
import { Follow } from "../models/follow.model"
import { publish } from "../clients/rabbitmq"

class ProfileService {
  async createProfile(input: CreateProfileInput): Promise<Profile> {
    return Profile.create(input)
  }

  async getProfile(profileId: string): Promise<Profile | null> {
    return Profile.findOne({ where: { profileId } })
  }

  async updateProfile(profileId: string, input: UpdateProfileInput): Promise<Profile | null> {
    const profile = await Profile.findOne({ where: { profileId } })
    if (!profile) return null
    return profile.update(input)
  }

  async deleteProfile(profileId: string): Promise<boolean> {
    const profile = await Profile.findOne({ where: { profileId } })
    if (!profile) return false
    await profile.destroy() // soft-delete via paranoid
    return true
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    await Follow.create({ followerId, followingId })

    await Profile.increment("followingCount", { where: { profileId: followerId } })
    await Profile.increment("followersCount", { where: { profileId: followingId } })

    void publish("social.follow", { followerId, followingId })
  }

  async unfollow(followerId: string, followingId: string): Promise<boolean> {
    const follow = await Follow.findOne({ where: { followerId, followingId } })
    if (!follow) return false

    await follow.destroy()

    await Profile.decrement("followingCount", { where: { profileId: followerId } })
    await Profile.decrement("followersCount", { where: { profileId: followingId } })

    return true
  }

  async getFollowers(profileId: string): Promise<{ count: number; followers: string[] }> {
    const relations = await Follow.findAll({ where: { followingId: profileId } })
    const followers = relations.map((f) => f.get("followerId") as string)
    return { count: followers.length, followers }
  }

  async getFollowing(profileId: string): Promise<{ count: number; following: string[] }> {
    const relations = await Follow.findAll({ where: { followerId: profileId } })
    const following = relations.map((f) => f.get("followingId") as string)
    return { count: following.length, following }
  }
}

export default ProfileService
