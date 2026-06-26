import AuthService from "../../services/auth.service"
import { User } from "../../models/user.model"
import { EmailVerificationToken } from "../../models/email-verification-token.model"
import { PasswordResetToken } from "../../models/password-reset-token.model"
import { TwoFactorCode } from "../../models/two-factor-code.model"
import { hashPassword, verifyPassword } from "../../utils/password.util"
import { signToken } from "../../utils/jwt.util"
import { getRedis } from "../../clients/redis"

jest.mock("../../models/user.model", () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
}))

jest.mock("../../models/email-verification-token.model", () => ({
  EmailVerificationToken: {
    create: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
  },
}))

jest.mock("../../models/password-reset-token.model", () => ({
  PasswordResetToken: {
    create: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
  },
}))

jest.mock("../../models/two-factor-code.model", () => ({
  TwoFactorCode: {
    create: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
  },
}))

jest.mock("../../utils/password.util", () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}))

jest.mock("../../utils/jwt.util", () => ({
  signToken: jest.fn().mockReturnValue("mock-access-token"),
  generateRefreshToken: jest.fn().mockReturnValue("mock-refresh-raw"),
  hashRefreshToken: jest.fn().mockReturnValue("mock-refresh-hash"),
  signPendingGoogleToken: jest.fn().mockReturnValue("mock-pending-google-token"),
  verifyPendingGoogleToken: jest.fn().mockImplementation(() => ({
    googleId: "google-1",
    email: "google@example.com",
    emailVerified: true,
    firstName: "John",
    lastName: "Doe",
    picture: "https://example.com/pic.jpg",
  })),
  REFRESH_TOKEN_TTL_MS: 7 * 24 * 60 * 60 * 1000,
}))

let mockRedis: Record<string, jest.Mock>
let mockMulti: Record<string, jest.Mock>

jest.mock("../../clients/redis", () => ({
  getRedis: jest.fn(() => mockRedis),
}))

let mockOAuth2Client: { getToken: jest.Mock; verifyIdToken: jest.Mock }

jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn(() => mockOAuth2Client),
}))

beforeEach(() => {
  jest.clearAllMocks()
  service = new AuthService()
  mockMulti = {
    set: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    sadd: jest.fn().mockReturnThis(),
    srem: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    incr: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }
  mockRedis = {
    multi: jest.fn().mockReturnValue(mockMulti),
    get: jest.fn().mockResolvedValue(null),
    getdel: jest.fn().mockResolvedValue(null),
    ttl: jest.fn().mockResolvedValue(-1),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    smembers: jest.fn().mockResolvedValue([]),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
  }
  mockOAuth2Client = {
    getToken: jest.fn(),
    verifyIdToken: jest.fn(),
  }
})

const mockedUser = User as jest.Mocked<typeof User>
const mockedEVT = EmailVerificationToken as jest.Mocked<typeof EmailVerificationToken>
const mockedPRT = PasswordResetToken as jest.Mocked<typeof PasswordResetToken>
const mockedTFC = TwoFactorCode as jest.Mocked<typeof TwoFactorCode>
const mockedVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>
const mockedSignToken = signToken as jest.MockedFunction<typeof signToken>

const MOCK_USER = {
  id: "user-1",
  username: "alice",
  email: "alice@example.com",
  passwordHash: "salt:hash",
  role: "user",
  isBanned: false,
  isEmailVerified: false,
  twoFactorEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  toJSON: () => MOCK_USER,
}

let service: AuthService

describe("verifyCredentials", () => {
  it("authenticates user by email", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(MOCK_USER)
    mockedVerifyPassword.mockResolvedValue(true)

    const result = await service.verifyCredentials({
      identifier: "alice@example.com",
      password: "Pass1234",
    })

    expect(mockedUser.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "alice@example.com" } })
    )
    expect(mockedVerifyPassword).toHaveBeenCalledWith("Pass1234", "salt:hash")
    expect(result).toEqual(MOCK_USER)
  })

  it("authenticates user by username", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(MOCK_USER)
    mockedVerifyPassword.mockResolvedValue(true)

    await service.verifyCredentials({ identifier: "alice", password: "Pass1234" })

    expect(mockedUser.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { username: "alice" } })
    )
  })

  it("throws INVALID_CREDENTIALS when user not found", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(null)

    await expect(
      service.verifyCredentials({ identifier: "unknown@e.com", password: "x" })
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" })
  })

  it("throws INVALID_CREDENTIALS when passwordHash is null", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue({ ...MOCK_USER, passwordHash: null })

    await expect(
      service.verifyCredentials({ identifier: "alice@e.com", password: "x" })
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" })
  })

  it("throws INVALID_CREDENTIALS on wrong password", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(MOCK_USER)
    mockedVerifyPassword.mockResolvedValue(false)

    await expect(
      service.verifyCredentials({ identifier: "alice@e.com", password: "wrong" })
    ).rejects.toMatchObject({ code: "INVALID_CREDENTIALS" })
  })
})

describe("issueTokenPair", () => {
  it("creates access and refresh tokens, stores refresh in Redis", async () => {
    const result = await service.issueTokenPair({ sub: "user-1", role: "user" })

    expect(mockedSignToken).toHaveBeenCalledWith({ sub: "user-1", role: "user", isComplete: false })
    expect(mockMulti.set).toHaveBeenCalledWith(
      "refresh:mock-refresh-hash",
      expect.any(String),
      "EX",
      expect.any(Number)
    )
    expect(mockMulti.sadd).toHaveBeenCalledWith("session:user-1", "mock-refresh-hash")
    expect(mockMulti.exec).toHaveBeenCalled()
    expect(result).toEqual({ accessToken: "mock-access-token", refreshToken: "mock-refresh-raw" })
  })
})

describe("createEmailVerificationToken", () => {
  it("destroys old tokens and creates a new one", async () => {
    const result = await service.createEmailVerificationToken("user-1")

    expect(mockedEVT.destroy).toHaveBeenCalledWith({ where: { userId: "user-1", usedAt: null } })
    expect(mockedEVT.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", token: expect.any(String) })
    )
    expect(result).toMatchObject({
      token: expect.any(String),
      verifyUrl: expect.stringContaining("verify-email"),
    })
  })
})

describe("verifyEmail", () => {
  it("marks token as used and user as verified", async () => {
    const mockRecord = { update: jest.fn().mockResolvedValue(undefined) }
    ;(mockedEVT.findOne as jest.Mock).mockResolvedValue(mockRecord)

    await service.verifyEmail("valid-token")

    expect(mockedEVT.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ token: "valid-token", usedAt: null }),
      })
    )
    expect(mockRecord.update).toHaveBeenCalledWith({ usedAt: expect.any(Date) })
    expect(mockedUser.update).toHaveBeenCalledWith(
      { isEmailVerified: true },
      { where: { id: undefined } }
    )
  })

  it("throws INVALID_TOKEN when token not found", async () => {
    ;(mockedEVT.findOne as jest.Mock).mockResolvedValue(null)

    await expect(service.verifyEmail("bad-token")).rejects.toMatchObject({ code: "INVALID_TOKEN" })
  })
})

describe("createPasswordResetToken", () => {
  it("creates token and returns reset URL when user exists", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(MOCK_USER)

    const result = await service.createPasswordResetToken("alice@example.com")

    expect(mockedPRT.destroy).toHaveBeenCalledWith({ where: { userId: "user-1", usedAt: null } })
    expect(mockedPRT.create).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1" }))
    expect(result).toMatchObject({
      userId: "user-1",
      username: "alice",
      resetUrl: expect.stringContaining("reset-password"),
    })
  })

  it("returns null when user not found", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(null)

    const result = await service.createPasswordResetToken("ghost@e.com")
    expect(result).toBeNull()
  })
})

describe("resetPassword", () => {
  it("updates password and revokes sessions", async () => {
    const mockRecord = { userId: "user-1", update: jest.fn().mockResolvedValue(undefined) }
    ;(mockedPRT.findOne as jest.Mock).mockResolvedValue(mockRecord)
    mockedHashPassword.mockResolvedValue("new-salt:new-hash")
    mockRedis.smembers.mockResolvedValue(["h1", "h2"])

    await service.resetPassword("valid-token", "NewPass123")

    expect(mockedHashPassword).toHaveBeenCalledWith("NewPass123")
    expect(mockedUser.update).toHaveBeenCalledWith(
      { passwordHash: "new-salt:new-hash" },
      { where: { id: "user-1" } }
    )
    expect(mockRedis.smembers).toHaveBeenCalledWith("session:user-1")
  })

  it("throws INVALID_TOKEN when token not found", async () => {
    ;(mockedPRT.findOne as jest.Mock).mockResolvedValue(null)

    await expect(service.resetPassword("bad", "NewPass1")).rejects.toMatchObject({
      code: "INVALID_TOKEN",
    })
  })
})

describe("2FA code management", () => {
  it("createTwoFactorCode destroys old codes and creates a new one", async () => {
    const result = await service.createTwoFactorCode("user-1")

    expect(mockedTFC.destroy).toHaveBeenCalledWith({ where: { userId: "user-1", usedAt: null } })
    expect(mockedTFC.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1", code: expect.any(String) })
    )
    expect(result.code).toMatch(/^\d{6}$/)
    expect(result.expiresAt).toBeInstanceOf(Date)
  })

  it("verifyTwoFactorCode succeeds with valid code", async () => {
    ;(mockedTFC.findOne as jest.Mock).mockResolvedValue({ update: jest.fn() })

    await service.verifyTwoFactorCode("user-1", "123456")

    expect(mockedTFC.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          code: "123456",
          usedAt: null,
          expiresAt: expect.any(Object),
        }),
      })
    )
    expect(mockRedis.del).toHaveBeenCalledWith("2fa:attempts:user-1")
  })

  it("verifyTwoFactorCode throws on wrong code", async () => {
    ;(mockedTFC.findOne as jest.Mock).mockResolvedValue(null)
    mockRedis.incr.mockResolvedValue(1)
    mockRedis.expire.mockResolvedValue(1)

    await expect(service.verifyTwoFactorCode("user-1", "000000")).rejects.toMatchObject({
      code: "INVALID_2FA_CODE",
    })
    expect(mockMulti.incr).toHaveBeenCalledWith("2fa:attempts:user-1")
  })

  it("verifyTwoFactorCode throws TWO_FACTOR_LOCKED after max attempts", async () => {
    mockRedis.get.mockResolvedValue("5")

    await expect(service.verifyTwoFactorCode("user-1", "000000")).rejects.toMatchObject({
      code: "TWO_FACTOR_LOCKED",
    })
  })
})

describe("enableTwoFactor / disableTwoFactor", () => {
  it("enableTwoFactor sets flag to true", async () => {
    await service.enableTwoFactor("user-1")
    expect(mockedUser.update).toHaveBeenCalledWith(
      { twoFactorEnabled: true },
      { where: { id: "user-1" } }
    )
  })

  it("disableTwoFactor sets flag to false and destroys codes", async () => {
    await service.disableTwoFactor("user-1")
    expect(mockedUser.update).toHaveBeenCalledWith(
      { twoFactorEnabled: false },
      { where: { id: "user-1" } }
    )
    expect(mockedTFC.destroy).toHaveBeenCalledWith({ where: { userId: "user-1" } })
  })
})

describe("resendVerification", () => {
  it("returns token when user exists and is not verified", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(MOCK_USER)

    const result = await service.resendVerification("alice@example.com")

    expect(mockedUser.findOne).toHaveBeenCalledWith({ where: { email: "alice@example.com" } })
    expect(result).toMatchObject({
      userId: "user-1",
      username: "alice",
      verifyUrl: expect.stringContaining("verify-email"),
    })
  })

  it("returns null when user not found", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(null)

    const result = await service.resendVerification("ghost@example.com")
    expect(result).toBeNull()
  })

  it("returns null when user is already verified", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue({ ...MOCK_USER, isEmailVerified: true })

    const result = await service.resendVerification("verified@example.com")
    expect(result).toBeNull()
  })
})

describe("revokeAllRefreshTokens", () => {
  it("deletes all session hashes from redis", async () => {
    mockRedis.smembers.mockResolvedValue(["hash1", "hash2"])

    await service.revokeAllRefreshTokens("user-1")

    expect(mockRedis.smembers).toHaveBeenCalledWith("session:user-1")
    expect(mockMulti.del).toHaveBeenCalledWith("refresh:hash1")
    expect(mockMulti.del).toHaveBeenCalledWith("consumed:hash1")
    expect(mockMulti.del).toHaveBeenCalledWith("refresh:hash2")
    expect(mockMulti.del).toHaveBeenCalledWith("consumed:hash2")
    expect(mockMulti.del).toHaveBeenCalledWith("session:user-1")
    expect(mockMulti.exec).toHaveBeenCalled()
  })

  it("does nothing when no session hashes exist", async () => {
    mockRedis.smembers.mockResolvedValue([])

    await service.revokeAllRefreshTokens("user-1")

    expect(mockMulti.exec).not.toHaveBeenCalled()
  })
})

describe("rotateRefreshToken", () => {
  const RECORD = JSON.stringify({ userId: "user-1", role: "user", isComplete: true })

  it("returns new token pair and user on valid rotation", async () => {
    mockRedis.getdel.mockResolvedValue(RECORD)
    mockRedis.ttl.mockResolvedValue(3600)
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue(MOCK_USER)

    const result = await service.rotateRefreshToken("old-refresh-token")

    expect(mockRedis.getdel).toHaveBeenCalledWith("refresh:mock-refresh-hash")
    expect(mockMulti.set).toHaveBeenCalledWith("refresh:mock-refresh-hash", RECORD, "EX", 3600)
    expect(mockMulti.set).toHaveBeenCalledWith("consumed:mock-refresh-hash", RECORD, "EX", 3600)
    expect(result).toEqual({
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-raw",
      user: expect.objectContaining({ id: "user-1" }),
    })
  })

  it("falls back to REFRESH_TTL_SECONDS when ttl is -1", async () => {
    mockRedis.getdel.mockResolvedValue(RECORD)
    mockRedis.ttl.mockResolvedValue(-1)
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue(MOCK_USER)

    await service.rotateRefreshToken("old-token")

    const expectedTtl = Math.floor(7 * 24 * 60 * 60 * 1000 / 1000)
    expect(mockMulti.set).toHaveBeenCalledWith("refresh:mock-refresh-hash", RECORD, "EX", expectedTtl)
  })

  it("throws INVALID_REFRESH when token does not exist and is not consumed", async () => {
    mockRedis.getdel.mockResolvedValue(null)
    mockRedis.get.mockResolvedValue(null)

    await expect(service.rotateRefreshToken("bad-token")).rejects.toMatchObject({
      code: "INVALID_REFRESH",
    })
  })

  it("throws INVALID_REFRESH and wipes session when reuse detected", async () => {
    mockRedis.getdel.mockResolvedValue(null)
    mockRedis.get.mockResolvedValue(JSON.stringify({ userId: "user-1" }))
    mockRedis.smembers.mockResolvedValue(["h1"])

    await expect(service.rotateRefreshToken("reused-token")).rejects.toMatchObject({
      code: "INVALID_REFRESH",
    })
    expect(mockMulti.del).toHaveBeenCalledWith("refresh:h1")
  })

  it("throws INVALID_REFRESH when user not found", async () => {
    mockRedis.getdel.mockResolvedValue(RECORD)
    mockRedis.ttl.mockResolvedValue(3600)
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue(null)

    await expect(service.rotateRefreshToken("valid-but-missing-user")).rejects.toMatchObject({
      code: "INVALID_REFRESH",
    })
  })
})

describe("Google OAuth - startGoogleOAuth", () => {
  it("returns a google auth URL with params", async () => {
    const url = await service.startGoogleOAuth()

    expect(url).toContain("https://accounts.google.com/o/oauth2/v2/auth")
    expect(url).toContain("client_id=")
    expect(url).toContain("redirect_uri=")
    expect(url).toContain("response_type=code")
    expect(url).toContain("code_challenge=")
    expect(url).toContain("state=")
    expect(mockRedis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^oauth:/),
      expect.any(String),
      "EX",
      600
    )
  })
})

describe("Google OAuth - resolveGoogleOAuthSession", () => {
  it("returns codeVerifier when state exists", async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ codeVerifier: "abc123" }))

    const result = await service.resolveGoogleOAuthSession("valid-state")

    expect(mockRedis.get).toHaveBeenCalledWith("oauth:valid-state")
    expect(mockRedis.del).toHaveBeenCalledWith("oauth:valid-state")
    expect(result).toBe("abc123")
  })

  it("returns null when state does not exist", async () => {
    mockRedis.get.mockResolvedValue(null)

    const result = await service.resolveGoogleOAuthSession("invalid-state")

    expect(result).toBeNull()
  })
})

describe("Google OAuth - findOrCreateGoogleUser", () => {
  beforeEach(() => {
    mockOAuth2Client.getToken.mockResolvedValue({
      tokens: { id_token: "mock-id-token" },
    })
    mockOAuth2Client.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: "google-sub-123",
        email: "google@example.com",
        email_verified: true,
        given_name: "John",
        family_name: "Doe",
        picture: "https://example.com/pic.jpg",
      }),
    })
  })

  it("returns existing user when googleId matches", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValueOnce(MOCK_USER)

    const result = await service.findOrCreateGoogleUser("code", "verifier")

    expect(result).toEqual({ isNewUser: false, user: MOCK_USER })
  })

  it("links googleId to existing email when email matches and verified", async () => {
    const updateMock = jest.fn().mockResolvedValue(undefined)
    ;(mockedUser.findOne as jest.Mock)
      .mockResolvedValueOnce(null) // no googleId match
      .mockResolvedValueOnce({ ...MOCK_USER, update: updateMock }) // email match

    const result = await service.findOrCreateGoogleUser("code", "verifier")

    expect(result).toEqual({ isNewUser: false, user: MOCK_USER })
    expect(updateMock).toHaveBeenCalledWith({ googleId: "google-sub-123" })
  })

  it("throws when email exists but is not verified with Google", async () => {
    mockOAuth2Client.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: "google-sub-123",
        email: "google@example.com",
        email_verified: false,
      }),
    })
    ;(mockedUser.findOne as jest.Mock)
      .mockResolvedValueOnce(null) // no googleId match
      .mockResolvedValueOnce(MOCK_USER) // email match

    await expect(service.findOrCreateGoogleUser("code", "verifier")).rejects.toMatchObject({
      code: "GOOGLE_EMAIL_UNVERIFIED",
    })
  })

  it("returns pending token for new user", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(null) // no googleId, no email

    const result = await service.findOrCreateGoogleUser("code", "verifier")

    expect(result).toEqual({ isNewUser: true, pendingToken: "mock-pending-google-token" })
  })

  it("throws GOOGLE_AUTH_FAILED when no id_token returned", async () => {
    mockOAuth2Client.getToken.mockResolvedValue({ tokens: {} })

    await expect(service.findOrCreateGoogleUser("code", "verifier")).rejects.toMatchObject({
      code: "GOOGLE_AUTH_FAILED",
    })
  })

  it("throws GOOGLE_AUTH_FAILED when payload missing sub or email", async () => {
    mockOAuth2Client.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ email_verified: true }),
    })

    await expect(service.findOrCreateGoogleUser("code", "verifier")).rejects.toMatchObject({
      code: "GOOGLE_AUTH_FAILED",
    })
  })
})

describe("Google OAuth - completeGoogleAuth", () => {
  it("creates new user and returns tokens", async () => {
    const newUser = {
      ...MOCK_USER,
      id: "new-user-1",
      username: "newgoogleuser",
      email: "google@example.com",
      toJSON: () => ({
        ...MOCK_USER,
        id: "new-user-1",
        username: "newgoogleuser",
        email: "google@example.com",
      }),
    }
    ;(mockedUser.count as jest.Mock).mockResolvedValue(0) // username not taken
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(null) // no existing googleId
    ;(mockedUser.create as jest.Mock).mockResolvedValue(newUser)

    const result = await service.completeGoogleAuth("pending-token", "newgoogleuser")

    expect(result).toEqual({
      user: expect.objectContaining({ id: "new-user-1", username: "newgoogleuser" }),
      created: true,
      googleClaims: {
        firstName: "John",
        lastName: "Doe",
        picture: "https://example.com/pic.jpg",
      },
    })
    expect(mockedUser.count).toHaveBeenCalledWith({
      where: { username: "newgoogleuser" },
    })
  })

  it("throws USERNAME_TAKEN when username already exists", async () => {
    ;(mockedUser.count as jest.Mock).mockResolvedValue(1)

    await expect(service.completeGoogleAuth("pending-token", "takenuser")).rejects.toMatchObject({
      code: "USERNAME_TAKEN",
    })
  })

  it("returns existing user on double-submit guard", async () => {
    ;(mockedUser.count as jest.Mock).mockResolvedValue(0) // username not taken
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(MOCK_USER) // existing googleId

    const result = await service.completeGoogleAuth("pending-token", "existinguser")

    expect(result).toEqual({
      user: MOCK_USER,
      created: false,
      googleClaims: {
        firstName: "John",
        lastName: "Doe",
        picture: "https://example.com/pic.jpg",
      },
    })
    expect(mockedUser.create).not.toHaveBeenCalled()
  })
})
