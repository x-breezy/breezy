import { Profile, CreateProfileInput, UpdateProfileInput } from "../models/profile.model"
import { Follow } from "../models/follow.model"

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
  }

  async unfollow(followerId: string, followingId: string): Promise<boolean> {
    const follow = await Follow.findOne({ where: { followerId, followingId } })
    if (!follow) return false

    await follow.destroy()

    await Profile.decrement("followingCount", { where: { profileId: followerId } })
    await Profile.decrement("followersCount", { where: { profileId: followingId } })

    return true
  }

  async getRelations(profileId: string): Promise<{
    followers: Profile[]
    following: Profile[]
  }> {
    const [followerRelations, followingRelations] = await Promise.all([
      Follow.findAll({ where: { followingId: profileId } }),
      Follow.findAll({ where: { followerId: profileId } }),
    ])

    const followerIds = followerRelations.map(f => f.followerId)
    const followingIds = followingRelations.map(f => f.followingId)

    const [followers, following] = await Promise.all([
      Profile.findAll({ where: { profileId: followerIds } }),
      Profile.findAll({ where: { profileId: followingIds } }),
    ])

    return { followers, following }
  }
}

export default ProfileService
