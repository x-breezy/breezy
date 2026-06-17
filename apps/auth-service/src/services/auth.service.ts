import { randomUUID, randomInt, randomBytes, createHash } from "crypto"
import { Op } from "sequelize"
import { OAuth2Client } from "google-auth-library"
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
  signPendingGoogleToken,
  verifyPendingGoogleToken,
  type TokenClaims,
} from "../utils/jwt.util"
import { getRedis } from "../clients/redis"
import type { Role } from "../constants/roles"
import type { SignInDTO } from "../schemas/auth.schema"

const APP_URL = process.env.APP_URL ?? "http://localhost:3000"
const REFRESH_TTL_SECONDS = Math.floor(REFRESH_TOKEN_TTL_MS / 1000)

const GRACE_TTL_SECONDS = 60

const TWO_FACTOR_MAX_ATTEMPTS = 5
const TWO_FACTOR_LOCKOUT_SECONDS = 300

// Atomic refresh-token rotation with grace window to absorb concurrent replays.
// Return codes: 0 = unknown, 1 = rotated/replayed (record in result[1]), 3 = reuse detected + session wiped.
const ROTATE_SCRIPT = `
local oldHash = ARGV[1]
local newHash = ARGV[2]
local refreshTTL = tonumber(ARGV[3])
local graceTTL = tonumber(ARGV[4])

local function doRotate(fromHash, toHash, record)
  local r = cjson.decode(record)
  local uid = r['userId']
  local sk = 'session:' .. uid
  local cv = cjson.encode({userId=uid, role=r['role'], newHash=toHash})
  redis.call('DEL', 'refresh:' .. fromHash)
  redis.call('SET', 'consumed:' .. fromHash, cv, 'EX', refreshTTL)
  redis.call('SET', 'grace:' .. fromHash, '1', 'EX', graceTTL)
  redis.call('SREM', sk, fromHash)
  redis.call('SET', 'refresh:' .. toHash, record, 'EX', refreshTTL)
  redis.call('SADD', sk, toHash)
  return {1, record}
end

local data = redis.call('GET', 'refresh:' .. oldHash)
if data then return doRotate(oldHash, newHash, data) end

local cv = redis.call('GET', 'consumed:' .. oldHash)
if not cv then return {0} end

if redis.call('EXISTS', 'grace:' .. oldHash) == 0 then
  local c = cjson.decode(cv)
  local sk = 'session:' .. c['userId']
  local hashes = redis.call('SMEMBERS', sk)
  for _, h in ipairs(hashes) do
    redis.call('DEL', 'refresh:' .. h)
    redis.call('DEL', 'consumed:' .. h)
    redis.call('DEL', 'grace:' .. h)
  end
  redis.call('DEL', sk)
  return {3}
end

local c = cjson.decode(cv)
local prevData = redis.call('GET', 'refresh:' .. c['newHash'])
if prevData then return doRotate(c['newHash'], newHash, prevData) end
return {0}
`

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
    if (!user || !user.passwordHash) {
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
    const oldHash = hashRefreshToken(raw)
    const redis = getRedis()

    const newRefreshToken = generateRefreshToken()
    const newHash = hashRefreshToken(newRefreshToken)

    const result = (await redis.eval(
      ROTATE_SCRIPT,
      0,
      oldHash,
      newHash,
      String(REFRESH_TTL_SECONDS),
      String(GRACE_TTL_SECONDS)
    )) as (string | number)[]

    const status = result[0] as number

    if (status === 0 || status === 3) {
      throw Object.assign(new Error("Invalid refresh token"), { code: "INVALID_REFRESH" })
    }

    const record = JSON.parse(result[1] as string) as RefreshRecord
    const user = await User.findByPk(record.userId)
    if (!user) {
      throw Object.assign(new Error("Invalid refresh token"), { code: "INVALID_REFRESH" })
    }

    const accessToken = signToken({ sub: record.userId, role: record.role })
    return { accessToken, refreshToken: newRefreshToken, user: user.toJSON() }
  }

  async revokeRefreshToken(raw: string): Promise<void> {
    const tokenHash = hashRefreshToken(raw)
    const redis = getRedis()
    const data = await redis.get(`refresh:${tokenHash}`)
    if (!data) return
    const { userId } = JSON.parse(data) as RefreshRecord
    await redis
      .multi()
      .del(`refresh:${tokenHash}`)
      .del(`consumed:${tokenHash}`)
      .del(`grace:${tokenHash}`)
      .srem(`session:${userId}`, tokenHash)
      .exec()
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    const redis = getRedis()
    const sessionHashes = await redis.smembers(`session:${userId}`)
    if (sessionHashes.length === 0) return
    const pipeline = redis.multi()
    for (const hash of sessionHashes) {
      pipeline.del(`refresh:${hash}`)
      pipeline.del(`consumed:${hash}`)
      pipeline.del(`grace:${hash}`)
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
    const redis = getRedis()
    const attemptsKey = `2fa:attempts:${userId}`

    const attempts = await redis.get(attemptsKey)
    if (attempts && parseInt(attempts) >= TWO_FACTOR_MAX_ATTEMPTS) {
      throw Object.assign(new Error("Too many attempts, try again later"), {
        code: "TWO_FACTOR_LOCKED",
      })
    }

    const record = await TwoFactorCode.findOne({
      where: { userId, code, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
    })

    if (!record) {
      await redis.multi().incr(attemptsKey).expire(attemptsKey, TWO_FACTOR_LOCKOUT_SECONDS).exec()
      throw Object.assign(new Error("Invalid or expired code"), { code: "INVALID_2FA_CODE" })
    }

    await redis.del(attemptsKey)
    await record.update({ usedAt: new Date() })
  }

  async enableTwoFactor(userId: string): Promise<void> {
    await User.update({ twoFactorEnabled: true }, { where: { id: userId } })
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await User.update({ twoFactorEnabled: false }, { where: { id: userId } })
    await TwoFactorCode.destroy({ where: { userId } })
  }

  async startGoogleOAuth(): Promise<string> {
    const state = randomBytes(32).toString("hex")
    const codeVerifier = randomBytes(32).toString("base64url")
    const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url")

    const redis = getRedis()
    await redis.set(`oauth:${state}`, JSON.stringify({ codeVerifier }), "EX", 600)

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ?? "http://localhost/api/auth/google/callback"
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  async resolveGoogleOAuthSession(state: string): Promise<string | null> {
    const redis = getRedis()
    const data = await redis.get(`oauth:${state}`)
    if (!data) return null
    await redis.del(`oauth:${state}`)
    return (JSON.parse(data) as { codeVerifier: string }).codeVerifier
  }

  async findOrCreateGoogleUser(
    code: string,
    codeVerifier: string
  ): Promise<{ isNewUser: false; user: SafeUser } | { isNewUser: true; pendingToken: string }> {
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ?? "http://localhost/api/auth/google/callback"
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    )

    const { tokens } = await client.getToken({ code, codeVerifier })
    if (!tokens.id_token) {
      throw Object.assign(new Error("No ID token from Google"), { code: "GOOGLE_AUTH_FAILED" })
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const payload = ticket.getPayload()
    if (!payload?.sub || !payload.email) {
      throw Object.assign(new Error("Invalid Google payload"), { code: "GOOGLE_AUTH_FAILED" })
    }

    const { sub: googleId, email, email_verified, given_name, family_name, picture } = payload

    const byGoogleId = await User.findOne({ where: { googleId } })
    if (byGoogleId) return { isNewUser: false, user: byGoogleId.toJSON() }

    const byEmail = await User.findOne({ where: { email } })
    if (byEmail) {
      if (!email_verified) {
        throw Object.assign(new Error("Cannot link unverified Google email to existing account"), {
          code: "GOOGLE_EMAIL_UNVERIFIED",
        })
      }
      await byEmail.update({ googleId })
      return { isNewUser: false, user: byEmail.toJSON() }
    }

    // New user, don't create account yet, wait for username selection
    const pendingToken = signPendingGoogleToken({
      googleId,
      email,
      emailVerified: email_verified ?? false,
      firstName: given_name,
      lastName: family_name,
      picture,
    })
    return { isNewUser: true, pendingToken }
  }

  async completeGoogleAuth(
    pendingToken: string,
    username: string
  ): Promise<{
    user: SafeUser
    created: boolean
    googleClaims: { firstName?: string; lastName?: string; picture?: string }
  }> {
    const claims = verifyPendingGoogleToken(pendingToken)

    const usernameTaken = (await User.count({ where: { username } })) > 0
    if (usernameTaken) {
      throw Object.assign(new Error("Username already taken"), { code: "USERNAME_TAKEN" })
    }

    const googleClaims = {
      firstName: claims.firstName,
      lastName: claims.lastName,
      picture: claims.picture,
    }

    // Double-submit guard: account may have been created by a previous attempt
    const existing = await User.findOne({ where: { googleId: claims.googleId } })
    if (existing) return { user: existing.toJSON(), created: false, googleClaims }

    const newUser = await User.create({
      username,
      email: claims.email,
      passwordHash: null,
      googleId: claims.googleId,
      isEmailVerified: claims.emailVerified,
    })

    return { user: newUser.toJSON(), created: true, googleClaims }
  }
}

export default AuthService
