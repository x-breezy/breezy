import { randomUUID, randomInt } from "crypto"
import { Op } from "sequelize"
import { User, type SafeUser } from "../models/user.model"
import { EmailVerificationToken } from "../models/email-verification-token.model"
import { PasswordResetToken } from "../models/password-reset-token.model"
import { TwoFactorCode } from "../models/two-factor-code.model"
import { hashPassword, verifyPassword } from "../utils/password.util"
import {
  signToken,
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_MS,
  type TokenClaims,
} from "../utils/jwt.util"
import { getRedis } from "../clients/redis"
import type { Role } from "../constants/roles"
import type { SignInDTO } from "../schemas/auth.schema"

const APP_URL = process.env.APP_URL ?? "http://localhost:3000"

const REFRESH_TTL_SECONDS = Math.floor(REFRESH_TOKEN_TTL_MS / 1000)

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

interface RefreshRecord {
  userId: string
  role: Role
}

class AuthService {
  async verifyCredentials(input: SignInDTO): Promise<SafeUser> {
    const isEmail = input.identifier.includes("@")
    const user = await User.findOne({
      where: isEmail ? { email: input.identifier } : { username: input.identifier },
      attributes: [
        "id",
        "username",
        "email",
        "passwordHash",
        "role",
        "isBanned",
        "isSuspended",
        "isEmailVerified",
        "twoFactorEnabled",
        "createdAt",
        "updatedAt",
      ],
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

  async issueTokenPair(claims: TokenClaims): Promise<TokenPair> {
    const accessToken = signToken(claims)
    const refreshToken = generateRefreshToken()
    const tokenHash = hashRefreshToken(refreshToken)
    const redis = getRedis()

    const record: RefreshRecord = { userId: claims.sub, role: claims.role }
    await redis
      .multi()
      .set(`refresh:${tokenHash}`, JSON.stringify(record), "EX", REFRESH_TTL_SECONDS)
      .sadd(`session:${claims.sub}`, tokenHash)
      .exec()

    return { accessToken, refreshToken }
  }

  async rotateRefreshToken(raw: string): Promise<TokenPair & { user: SafeUser }> {
    const tokenHash = hashRefreshToken(raw)
    const redis = getRedis()

    const data = await redis.get(`refresh:${tokenHash}`)
    if (!data) {
      // check if this was already consumed, detect reuse and revoke entire session
      const consumedUserId = await redis.get(`consumed:${tokenHash}`)
      if (consumedUserId) {
        const sessionHashes = await redis.smembers(`session:${consumedUserId}`)
        if (sessionHashes.length > 0) {
          const pipeline = redis.multi()
          for (const hash of sessionHashes) {
            pipeline.del(`refresh:${hash}`)
            pipeline.del(`consumed:${hash}`)
          }
          pipeline.del(`session:${consumedUserId}`)
          await pipeline.exec()
        }
      }
      throw Object.assign(new Error("Invalid refresh token"), { code: "INVALID_REFRESH" })
    }

    const { userId, role } = JSON.parse(data) as RefreshRecord

    const user = await User.findByPk(userId)
    if (!user) {
      throw Object.assign(new Error("Invalid refresh token"), { code: "INVALID_REFRESH" })
    }

    const newRefreshToken = generateRefreshToken()
    const newHash = hashRefreshToken(newRefreshToken)
    const newRecord: RefreshRecord = { userId, role }

    await redis
      .multi()
      .del(`refresh:${tokenHash}`)
      .set(`consumed:${tokenHash}`, userId, "EX", REFRESH_TTL_SECONDS)
      .srem(`session:${userId}`, tokenHash)
      .set(`refresh:${newHash}`, JSON.stringify(newRecord), "EX", REFRESH_TTL_SECONDS)
      .sadd(`session:${userId}`, newHash)
      .exec()

    const safeUser = user.toJSON()
    const accessToken = signToken({ sub: safeUser.id, role: safeUser.role })
    return { accessToken, refreshToken: newRefreshToken, user: safeUser }
  }

  async revokeRefreshToken(raw: string): Promise<void> {
    const tokenHash = hashRefreshToken(raw)
    const redis = getRedis()
    const data = await redis.get(`refresh:${tokenHash}`)
    if (!data) return
    const { userId } = JSON.parse(data) as RefreshRecord
    await redis.multi().del(`refresh:${tokenHash}`).srem(`session:${userId}`, tokenHash).exec()
  }

  private async revokeAllRefreshTokens(userId: string): Promise<void> {
    const redis = getRedis()
    const sessionHashes = await redis.smembers(`session:${userId}`)
    if (sessionHashes.length === 0) return
    const pipeline = redis.multi()
    for (const hash of sessionHashes) {
      pipeline.del(`refresh:${hash}`)
    }
    pipeline.del(`session:${userId}`)
    await pipeline.exec()
  }

  async createEmailVerificationToken(
    userId: string
  ): Promise<{ token: string; verifyUrl: string }> {
    await EmailVerificationToken.destroy({ where: { userId, usedAt: null } })

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await EmailVerificationToken.create({ userId, token, expiresAt, usedAt: null })

    return { token, verifyUrl: `${APP_URL}/verify-email?token=${token}` }
  }

  async resendVerification(
    email: string
  ): Promise<{ userId: string; username: string; token: string; verifyUrl: string } | null> {
    const user = await User.findOne({ where: { email } })
    if (!user || user.isEmailVerified) return null
    const { token, verifyUrl } = await this.createEmailVerificationToken(user.id)
    return { userId: user.id, username: user.username, token, verifyUrl }
  }

  async verifyEmail(token: string): Promise<void> {
    const record = await EmailVerificationToken.findOne({
      where: { token, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
    })
    if (!record) {
      throw Object.assign(new Error("Invalid or expired token"), { code: "INVALID_TOKEN" })
    }

    await record.update({ usedAt: new Date() })
    await User.update({ isEmailVerified: true }, { where: { id: record.userId } })
  }

  async createPasswordResetToken(
    email: string
  ): Promise<{ userId: string; username: string; token: string; resetUrl: string } | null> {
    const user = await User.findOne({ where: { email } })
    if (!user) return null

    await PasswordResetToken.destroy({ where: { userId: user.id, usedAt: null } })

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    await PasswordResetToken.create({ userId: user.id, token, expiresAt, usedAt: null })

    return {
      userId: user.id,
      username: user.username,
      token,
      resetUrl: `${APP_URL}/reset-password?token=${token}`,
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const record = await PasswordResetToken.findOne({
      where: { token, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
    })
    if (!record) {
      throw Object.assign(new Error("Invalid or expired token"), { code: "INVALID_TOKEN" })
    }

    const passwordHash = await hashPassword(newPassword)
    await record.update({ usedAt: new Date() })
    await User.update({ passwordHash }, { where: { id: record.userId } })
    await this.revokeAllRefreshTokens(record.userId)
  }

  async createTwoFactorCode(userId: string): Promise<{ code: string; expiresAt: Date }> {
    await TwoFactorCode.destroy({ where: { userId, usedAt: null } })

    const code = String(randomInt(100000, 999999))
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    await TwoFactorCode.create({ userId, code, expiresAt, usedAt: null })

    return { code, expiresAt }
  }

  async verifyTwoFactorCode(userId: string, code: string): Promise<void> {
    const record = await TwoFactorCode.findOne({
      where: { userId, code, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
    })
    if (!record) {
      throw Object.assign(new Error("Invalid or expired code"), { code: "INVALID_2FA_CODE" })
    }
    await record.update({ usedAt: new Date() })
  }

  async enableTwoFactor(userId: string): Promise<void> {
    await User.update({ twoFactorEnabled: true }, { where: { id: userId } })
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await User.update({ twoFactorEnabled: false }, { where: { id: userId } })
    await TwoFactorCode.destroy({ where: { userId } })
  }
}

export default AuthService
