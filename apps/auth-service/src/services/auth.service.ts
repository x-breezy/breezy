import { randomUUID, randomInt } from "crypto"
import { Op } from "sequelize"
import { User, type SafeUser } from "../models/user.model"
import { EmailVerificationToken } from "../models/email-verification-token.model"
import { PasswordResetToken } from "../models/password-reset-token.model"
import { TwoFactorCode } from "../models/two-factor-code.model"
import { RefreshToken } from "../models/refresh-token.model"
import { hashPassword, verifyPassword } from "../utils/password.util"
import {
  signToken,
  generateRefreshToken,
  hashRefreshToken,
  REFRESH_TOKEN_TTL_MS,
  type TokenPayload,
} from "../utils/jwt.util"
import type { SignInDTO } from "../schemas/auth.schema"

const APP_URL = process.env.APP_URL ?? "http://localhost:3000"

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

/**
 * Owns authentication flows and all auth-related tokens (credential check,
 * email verification, password reset, 2FA codes, JWT access + refresh tokens).
 * Pure user CRUD stays in UserService.
 */
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
        "roles",
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

  /** Sign a short-lived access JWT and mint a rotating refresh token (stored hashed). */
  async issueTokenPair(payload: TokenPayload): Promise<TokenPair> {
    const accessToken = signToken(payload)
    const refreshToken = generateRefreshToken()
    await RefreshToken.create({
      userId: payload.sub,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      revokedAt: null,
      replacedBy: null,
    })
    return { accessToken, refreshToken }
  }

  /**
   * Validate a refresh token and rotate it. On reuse of an already-rotated token,
   * revoke the user's entire refresh-token set (compromise containment).
   */
  async rotateRefreshToken(raw: string): Promise<TokenPair & { user: SafeUser }> {
    const tokenHash = hashRefreshToken(raw)
    const record = await RefreshToken.findOne({ where: { tokenHash } })

    if (!record) {
      throw Object.assign(new Error("Invalid refresh token"), { code: "INVALID_REFRESH" })
    }
    if (record.revokedAt) {
      // Reuse of a rotated token => likely theft. Nuke all sessions for this user.
      await RefreshToken.update(
        { revokedAt: new Date() },
        { where: { userId: record.userId, revokedAt: null } }
      )
      throw Object.assign(new Error("Refresh token reuse detected"), { code: "INVALID_REFRESH" })
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw Object.assign(new Error("Refresh token expired"), { code: "INVALID_REFRESH" })
    }

    const user = await User.findByPk(record.userId)
    if (!user) {
      throw Object.assign(new Error("Invalid refresh token"), { code: "INVALID_REFRESH" })
    }

    const refreshToken = generateRefreshToken()
    const newHash = hashRefreshToken(refreshToken)
    await record.update({ revokedAt: new Date(), replacedBy: newHash })
    await RefreshToken.create({
      userId: user.id,
      tokenHash: newHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      revokedAt: null,
      replacedBy: null,
    })

    const safeUser = user.toJSON()
    const accessToken = signToken({ sub: safeUser.id, roles: safeUser.roles })
    return { accessToken, refreshToken, user: safeUser }
  }

  /** Revoke a single refresh token (logout). Silent if unknown/already revoked. */
  async revokeRefreshToken(raw: string): Promise<void> {
    await RefreshToken.update(
      { revokedAt: new Date() },
      { where: { tokenHash: hashRefreshToken(raw), revokedAt: null } }
    )
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

  /**
   * Issue a fresh verification token for an email if it belongs to an unverified
   * account. Returns null otherwise (caller always responds 200 to avoid enumeration).
   */
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
    // A password change invalidates every active session.
    await RefreshToken.update(
      { revokedAt: new Date() },
      { where: { userId: record.userId, revokedAt: null } }
    )
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
