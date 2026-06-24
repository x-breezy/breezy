import { Op, QueryTypes } from "sequelize"
import { Profile, CreateProfileInput, UpdateProfileInput } from "../models/profile.model"
import { Follow } from "../models/follow.model"
import { publish } from "../clients/rabbitmq"
import { getBannedUserIds } from "../clients/banned-users.consumer"

class ProfileService {
  async createProfile(input: CreateProfileInput): Promise<Profile> {
    const [profile] = await Profile.findOrCreate({
      where: { profileId: input.profileId },
      defaults: input,
    })
    return profile
  }

  async getProfile(profileId: string, viewerRole?: string): Promise<Profile | null> {
    if (viewerRole !== "admin") {
      const banned = await getBannedUserIds()
      if (banned.has(profileId)) return null
    }
    return Profile.findOne({ where: { profileId } })
  }

  async getProfileByUsername(username: string, viewerRole?: string): Promise<Profile | null> {
    const profile = await Profile.findOne({ where: { username } })
    if (!profile) return null
    if (viewerRole !== "admin") {
      const banned = await getBannedUserIds()
      if (banned.has(profile.profileId)) return null
    }
    return profile
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
    const [follower, followingProfile, isFollowBack] = await Promise.all([
      Profile.findOne({ where: { profileId: followerId } }),
      Profile.findOne({ where: { profileId: followingId } }),
      this.isFollowing(followingId, followerId),
    ])
    if (followingProfile?.role === "moderator" || followingProfile?.role === "admin") {
      return
    }
    void publish("social.follow", {
      followerId,
      followingId,
      username: follower?.username,
      avatarId: follower?.avatarId ?? undefined,
      isFollowBack,
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
    const banned = await getBannedUserIds()
    const offset = (page - 1) * limit
    const sequelize = Profile.sequelize!
    const bannedArray = [...banned]
    const bannedClause =
      bannedArray.length > 0
        ? `AND f.follower_id NOT IN (${bannedArray.map((_, i) => `:banned${i}`).join(",")})`
        : ""
    const bannedReplacements = Object.fromEntries(bannedArray.map((id, i) => [`banned${i}`, id]))
    const [rows, countRows] = await Promise.all([
      sequelize.query<{ id: string }>(
        `SELECT f.follower_id AS id
         FROM follows f
         JOIN profiles p ON p.profile_id = f.follower_id
         WHERE f.following_id = :profileId
           AND p.deleted_at IS NULL
           ${bannedClause}
         ORDER BY p.username ASC
         LIMIT :limit OFFSET :offset`,
        {
          replacements: { profileId, limit, offset, ...bannedReplacements },
          type: QueryTypes.SELECT,
        }
      ),
      sequelize.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count
         FROM follows f
         JOIN profiles p ON p.profile_id = f.follower_id
         WHERE f.following_id = :profileId
           AND p.deleted_at IS NULL
           ${bannedClause}`,
        {
          replacements: { profileId, ...bannedReplacements },
          type: QueryTypes.SELECT,
          plain: true,
        }
      ),
    ])
    return { count: countRows?.count ?? 0, followers: rows.map((r) => r.id) }
  }

  async getFollowing(
    profileId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ count: number; following: string[] }> {
    const banned = await getBannedUserIds()
    const offset = (page - 1) * limit
    const sequelize = Profile.sequelize!
    const bannedArray = [...banned]
    const bannedClause =
      bannedArray.length > 0
        ? `AND f.following_id NOT IN (${bannedArray.map((_, i) => `:banned${i}`).join(",")})`
        : ""
    const bannedReplacements = Object.fromEntries(bannedArray.map((id, i) => [`banned${i}`, id]))
    const [rows, countRows] = await Promise.all([
      sequelize.query<{ id: string }>(
        `SELECT f.following_id AS id
         FROM follows f
         JOIN profiles p ON p.profile_id = f.following_id
         WHERE f.follower_id = :profileId
           AND p.deleted_at IS NULL
           ${bannedClause}
         ORDER BY p.username ASC
         LIMIT :limit OFFSET :offset`,
        {
          replacements: { profileId, limit, offset, ...bannedReplacements },
          type: QueryTypes.SELECT,
        }
      ),
      sequelize.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count
         FROM follows f
         JOIN profiles p ON p.profile_id = f.following_id
         WHERE f.follower_id = :profileId
           AND p.deleted_at IS NULL
           ${bannedClause}`,
        {
          replacements: { profileId, ...bannedReplacements },
          type: QueryTypes.SELECT,
          plain: true,
        }
      ),
    ])
    return { count: countRows?.count ?? 0, following: rows.map((r) => r.id) }
  }

  async getFollowSuggestions(
    profileId: string,
    limit: number = 3
  ): Promise<Profile[]> {
    const banned = await getBannedUserIds()
    const bannedArray = [...banned]
    const bannedClause =
      bannedArray.length > 0
        ? `AND p.profile_id NOT IN (${bannedArray.map((_, i) => `:banned${i}`).join(",")})`
        : ""
    const bannedReplacements = Object.fromEntries(bannedArray.map((id, i) => [`banned${i}`, id]))
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
         ${bannedClause}
       ORDER BY
         CASE WHEN EXISTS (
           SELECT 1 FROM follows
           WHERE follower_id = p.profile_id AND following_id = :profileId
         ) THEN 0 ELSE 1 END,
         p.followers_count DESC
       LIMIT :limit`,
      { replacements: { profileId, limit, ...bannedReplacements }, type: QueryTypes.SELECT }
    )
    return rows
  }

  async getProfilesByIdsUnfiltered(ids: string[]): Promise<Profile[]> {
    if (ids.length === 0) return []
    return Profile.findAll({ where: { profileId: ids } })
  }

  async getProfilesByIds(ids: string[]): Promise<Profile[]> {
    if (ids.length === 0) return []
    const banned = await getBannedUserIds()
    const filteredIds = banned.size > 0 ? ids.filter((id) => !banned.has(id)) : ids
    if (filteredIds.length === 0) return []
    return Profile.findAll({ where: { profileId: filteredIds } })
  }

  async search(
    q: string,
    page: number = 1,
    limit: number = 20,
    viewerId?: string,
  ): Promise<{ count: number; profiles: Profile[] }> {
    const offset = (page - 1) * limit
    const banned = await getBannedUserIds()
    const excludeIds = [...(viewerId ? [viewerId] : []), ...banned]
    const where = {
      [Op.or]: [
        { username: { [Op.iLike]: `%${q}%` } },
        { firstName: { [Op.iLike]: `%${q}%` } },
        { lastName: { [Op.iLike]: `%${q}%` } },
      ],
      ...(excludeIds.length > 0 ? { profileId: { [Op.notIn]: excludeIds } } : {}),
    }
    const { count, rows } = await Profile.findAndCountAll({ where, limit, offset })
    return { count, profiles: rows }
  }
}

export default ProfileService
