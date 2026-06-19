import { Op, QueryTypes } from "sequelize"
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
    const [follower, followingProfile] = await Promise.all([
      Profile.findOne({ where: { profileId: followerId } }),
      Profile.findOne({ where: { profileId: followingId } }),
    ])
    if (followingProfile?.role === "moderator" || followingProfile?.role === "admin") {
      return
    }
    void publish("social.follow", {
      followerId,
      followingId,
      username: follower?.username,
      avatarId: follower?.avatarId ?? undefined,
    })
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
    const sequelize = Profile.sequelize!
    const [rows, countResult] = await Promise.all([
      sequelize.query<{ id: string }>(
        `SELECT f.follower_id AS id
         FROM follows f
         JOIN profiles p ON p.profile_id = f.follower_id
         WHERE f.following_id = :profileId
           AND p.deleted_at IS NULL
         ORDER BY p.username ASC
         LIMIT :limit OFFSET :offset`,
        { replacements: { profileId, limit, offset }, type: QueryTypes.SELECT }
      ),
      Follow.count({ where: { followingId: profileId } }),
    ])
    return { count: countResult, followers: rows.map((r) => r.id) }
  }

  async getFollowing(
    profileId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ count: number; following: string[] }> {
    const offset = (page - 1) * limit
    const sequelize = Profile.sequelize!
    const [rows, countResult] = await Promise.all([
      sequelize.query<{ id: string }>(
        `SELECT f.following_id AS id
         FROM follows f
         JOIN profiles p ON p.profile_id = f.following_id
         WHERE f.follower_id = :profileId
           AND p.deleted_at IS NULL
         ORDER BY p.username ASC
         LIMIT :limit OFFSET :offset`,
        { replacements: { profileId, limit, offset }, type: QueryTypes.SELECT }
      ),
      Follow.count({ where: { followerId: profileId } }),
    ])
    return { count: countResult, following: rows.map((r) => r.id) }
  }

  async getFollowSuggestions(profileId: string, limit: number = 3): Promise<Profile[]> {
    const sequelize = Profile.sequelize!
    const rows = await sequelize.query<Profile>(
      `SELECT p.profile_id AS "profileId", p.username,
              p.first_name AS "firstName", p.last_name AS "lastName",
              p.avatar_url AS "avatarId", p.bio,
              p.followers_count AS "followersCount", p.role,
              p.deleted_at AS "deletedAt", p.created_at AS "createdAt",
              p.updated_at AS "updatedAt"
       FROM profiles p
       WHERE p.deleted_at IS NULL
         AND p.profile_id != :profileId
         AND p.profile_id NOT IN (
           SELECT following_id FROM follows WHERE follower_id = :profileId
         )
       ORDER BY
         CASE WHEN EXISTS (
           SELECT 1 FROM follows
           WHERE follower_id = p.profile_id AND following_id = :profileId
         ) THEN 0 ELSE 1 END,
         p.followers_count DESC
       LIMIT :limit`,
      { replacements: { profileId, limit }, type: QueryTypes.SELECT }
    )
    return rows
  }

  async getProfilesByIds(ids: string[]): Promise<Profile[]> {
    if (ids.length === 0) return []
    return Profile.findAll({ where: { profileId: ids } })
  }

  async search(
    q: string,
    page: number = 1,
    limit: number = 20,
    viewerId?: string
  ): Promise<{ count: number; profiles: Profile[] }> {
    const offset = (page - 1) * limit
    const where = {
      [Op.or]: [
        { username: { [Op.iLike]: `%${q}%` } },
        { firstName: { [Op.iLike]: `%${q}%` } },
        { lastName: { [Op.iLike]: `%${q}%` } },
      ],
      ...(viewerId ? { profileId: { [Op.ne]: viewerId } } : {}),
    }
    const { count, rows } = await Profile.findAndCountAll({ where, limit, offset })
    return { count, profiles: rows }
  }
}

export default ProfileService
