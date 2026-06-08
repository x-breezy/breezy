import { User, type SafeUser } from "../models/user.model"
import { hashPassword, verifyPassword } from "../utils/password.util"
import type { CreateUserDTO } from "../schemas/user.schema"
import { publish } from "../clients/rabbitmq"
import type { SignInDTO } from "../schemas/auth.schema"

class UserService {
  /** Create a user, hashing the plain password into passwordHash. Returns the safe (no-hash) user. */
  async addUser(input: CreateUserDTO): Promise<SafeUser> {
    const passwordHash = await hashPassword(input.password)
    const user = await User.create({
      username: input.username,
      email: input.email,
      passwordHash,
    })
    const safe = user.toJSON()
    void publish("auth.email_verification", {
      userId: safe.id,
      email: safe.email,
      token: safe.id,
    })
    return safe
  }

  async getUser(id: string): Promise<SafeUser | null> {
    const user = await User.findByPk(id)
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
  }

  async suspendUser(id: string): Promise<void> {
    const user = await User.findByPk(id)
    if (!user) throw Object.assign(new Error("User not found"), { code: "USER_NOT_FOUND" })
    await user.update({ isSuspended: true })
  }

  /** Verify credentials. Returns the safe user or throws INVALID_CREDENTIALS. */
  async signIn(input: SignInDTO): Promise<SafeUser> {
    const user = await User.findOne({
      where: { email: input.email },
      attributes: ["id", "username", "email", "passwordHash", "roles", "isBanned", "isSuspended", "createdAt", "updatedAt"],
    })
    if (!user) {
      throw Object.assign(new Error("Invalid credentials"), { code: "INVALID_CREDENTIALS" })
    }

    const valid = await verifyPassword(input.password, user.passwordHash)
    if (!valid) {
      throw Object.assign(new Error("Invalid credentials"), { code: "INVALID_CREDENTIALS" })
    }

    return user.toJSON()
  }

  /** Verify current password then store a new hash. Throws on wrong credentials. */
  async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findByPk(id, { attributes: ["id", "passwordHash"] })
    if (!user) {
      throw Object.assign(new Error("User not found"), { code: "USER_NOT_FOUND" })
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
