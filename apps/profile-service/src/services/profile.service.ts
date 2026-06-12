import { Op } from "sequelize"
import { Profile, CreateProfileInput, UpdateProfileInput } from "../models/profile.model"
import { Follow } from "../models/follow.model"
import { publish } from "../clients/rabbitmq"

class ProfileService {
  async createProfile(input: CreateProfileInput): Promise<Profile> {
    const [profile] = await Profile.findOrCreate({
      where: { profileId: input.profileId },
      defaults: input,
    })
    return profile
  }

  async getProfile(profileId: string): Promise<Profile | null> {
    return Profile.findOne({ where: { profileId } })
  }

  async getProfileByUsername(username: string): Promise<Profile | null> {
    return Profile.findOne({ where: { username } })
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

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await Follow.findOne({ where: { followerId, followingId } })
    return follow !== null
  }

  async follow(followerId: string, followingId: string): Promise<void> {
    await Profile.sequelize!.transaction(async (t) => {
      await Follow.create({ followerId, followingId }, { transaction: t })
      await Profile.increment("followingCount", {
        where: { profileId: followerId },
        transaction: t,
      })
      await Profile.increment("followersCount", {
        where: { profileId: followingId },
        transaction: t,
      })
    })
    publish("profile.followed", { followerId, followingId })
  }

  async unfollow(followerId: string, followingId: string): Promise<boolean> {
    return Profile.sequelize!.transaction(async (t) => {
      const follow = await Follow.findOne({ where: { followerId, followingId }, transaction: t })
      if (!follow) return false

      await follow.destroy({ transaction: t })
      await Profile.decrement("followingCount", {
        where: { profileId: followerId },
        transaction: t,
      })
      await Profile.decrement("followersCount", {
        where: { profileId: followingId },
        transaction: t,
      })

      return true
    })
  }

  async getFollowers(
    profileId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ count: number; followers: string[] }> {
    const offset = (page - 1) * limit
    const [relations, count] = await Promise.all([
      Follow.findAll({
        where: { followingId: profileId },
        attributes: ["followerId"],
        limit,
        offset,
      }),
      Follow.count({ where: { followingId: profileId } }),
    ])
    const followers = relations.map((f) => f.get("followerId") as string)
    return { count, followers }
  }

  async getFollowing(
    profileId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ count: number; following: string[] }> {
    const offset = (page - 1) * limit
    const [relations, count] = await Promise.all([
      Follow.findAll({
        where: { followerId: profileId },
        attributes: ["followingId"],
        limit,
        offset,
      }),
      Follow.count({ where: { followerId: profileId } }),
    ])
    const following = relations.map((f) => f.get("followingId") as string)
    return { count, following }
  }

  async getProfilesByIds(ids: string[]): Promise<Profile[]> {
    if (ids.length === 0) return []
    return Profile.findAll({ where: { profileId: ids } })
  }

  async search(
    q: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ count: number; profiles: Profile[] }> {
    const offset = (page - 1) * limit
    const where = {
      [Op.or]: [
        { username: { [Op.iLike]: `%${q}%` } },
        { firstName: { [Op.iLike]: `%${q}%` } },
        { lastName: { [Op.iLike]: `%${q}%` } },
      ],
    }
    const { count, rows } = await Profile.findAndCountAll({ where, limit, offset })
    return { count, profiles: rows }
  }
}

export default ProfileService
