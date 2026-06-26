import { Op } from "sequelize"
import { User, type SafeUser } from "../models/user.model"
import { hashPassword, verifyPassword } from "../utils/password.util"
import type { CreateUserDTO } from "../schemas/user.schema"
import { getRedis } from "../clients/redis"
import { publish } from "../clients/rabbitmq"

class UserService {
  async addUser(input: CreateUserDTO): Promise<SafeUser> {
    const passwordHash = await hashPassword(input.password)
    const user = await User.create({
      username: input.username,
      email: input.email,
      passwordHash,
      ...(input.role ? { role: input.role } : {}),
    })
    const safe = user.toJSON()
    return safe
  }

  async getUser(id: string): Promise<SafeUser | null> {
    const user = await User.findByPk(id)
    return user ? user.toJSON() : null
  }

  async getUserByUsername(username: string): Promise<SafeUser | null> {
    const user = await User.findOne({ where: { username } })
    return user ? user.toJSON() : null
  }

  async isEmailAndUsernameTaken(
    email: string,
    username: string
  ): Promise<{ emailTaken: boolean; usernameTaken: boolean }> {
    const [emailCount, usernameCount] = await Promise.all([
      User.count({ where: { email } }),
      User.count({ where: { username } }),
    ])
    return { emailTaken: emailCount > 0, usernameTaken: usernameCount > 0 }
  }

  async banUser(id: string): Promise<void> {
    const user = await User.findByPk(id)
    if (!user) throw Object.assign(new Error("User not found"), { code: "USER_NOT_FOUND" })
    await user.update({ isBanned: true })
    await this.revokeAllSessions(id)
    await getRedis().set(`banned:${id}`, "1")
    void publish("user.banned", { userId: id })
  }

  private async revokeAllSessions(userId: string): Promise<void> {
    const redis = getRedis()
    const hashes = await redis.smembers(`session:${userId}`)
    if (hashes.length === 0) return
    const pipeline = redis.multi()
    for (const hash of hashes) {
      pipeline.del(`refresh:${hash}`)
      pipeline.del(`consumed:${hash}`)
    }
    pipeline.del(`session:${userId}`)
    await pipeline.exec()
  }

  async listAll(
    page: number = 1,
    limit: number = 20
  ): Promise<{ count: number; users: SafeUser[] }> {
    const offset = (page - 1) * limit
    const { count, rows } = await User.findAndCountAll({
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    })
    return { count, users: rows.map((u) => u.toJSON()) }
  }

  async listSanctioned(
    page: number = 1,
    limit: number = 20
  ): Promise<{ count: number; users: SafeUser[] }> {
    const offset = (page - 1) * limit
    const where = { isBanned: true }
    const { count, rows } = await User.findAndCountAll({
      where,
      order: [["updatedAt", "DESC"]],
      limit,
      offset,
    })
    return { count, users: rows.map((u) => u.toJSON()) }
  }

  async unbanUser(id: string): Promise<void> {
    const user = await User.findByPk(id)
    if (!user) throw Object.assign(new Error("User not found"), { code: "USER_NOT_FOUND" })
    await user.update({ isBanned: false })
    await getRedis().del(`banned:${id}`)
    void publish("user.unbanned", { userId: id })
  }

  async searchByUsername(
    q: string,
    page: number = 1,
    limit: number = 20,
    excludeUserId?: string
  ): Promise<{ count: number; users: Pick<SafeUser, "id" | "username">[] }> {
    const offset = (page - 1) * limit

    const whereClause: any = {
      username: { [Op.iLike]: `%${q}%` },
      isBanned: false,
      isSuspended: false,
    }

    if (excludeUserId) {
      whereClause.id = { [Op.ne]: excludeUserId }
    }

    const { count, rows } = await User.findAndCountAll({
      where: {
        username: { [Op.iLike]: `%${q}%` },
        isBanned: false,
        ...whereClause,
      },
      attributes: ["id", "username"],
      limit,
      offset,
    })
    return {
      count,
      users: rows.map((u) => ({ id: u.id, username: u.username })),
    }
  }

  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findByPk(id, { attributes: ["id", "passwordHash"] })
    if (!user) {
      throw Object.assign(new Error("User not found"), { code: "USER_NOT_FOUND" })
    }
    if (!user.passwordHash) {
      throw Object.assign(new Error("Account uses Google sign-in, no password set"), {
        code: "NO_PASSWORD",
      })
    }

    const valid = await verifyPassword(currentPassword, user.passwordHash)
    if (!valid) {
      throw Object.assign(new Error("Invalid password"), { code: "INVALID_PASSWORD" })
    }

    const passwordHash = await hashPassword(newPassword)
    await user.update({ passwordHash })
  }
}

export default UserService
