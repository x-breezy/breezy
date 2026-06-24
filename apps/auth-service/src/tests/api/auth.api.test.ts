import express, { type Request, type Response, type NextFunction } from "express"
import request from "supertest"
import { createAuthRouter } from "../../routes/auth.route"
import AuthController from "../../controllers/auth.controller"
import { verifyToken, verifyPendingToken, signPendingToken } from "../../utils/jwt.util"
import { publish } from "../../clients/rabbitmq"

jest.mock("../../utils/jwt.util")
jest.mock("../../clients/rabbitmq", () => ({ publish: jest.fn() }))
jest.mock("../../middlewares/rate-limit.middleware", () => ({
  strictLimit: (req: any, res: any, next: any) => next(),
  authWriteLimit: (req: any, res: any, next: any) => next(),
  readLimit: (req: any, res: any, next: any) => next(),
  writeLimit: (req: any, res: any, next: any) => next(),
  searchLimit: (req: any, res: any, next: any) => next(),
}))
jest.mock("../../middlewares/email-rate-limit.middleware", () => ({
  emailSendRateLimit: (req: any, res: any, next: any) => next(),
  authenticatedEmailRateLimit: (req: any, res: any, next: any) => next(),
}))

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>
const mockVerifyPendingToken = verifyPendingToken as jest.MockedFunction<typeof verifyPendingToken>
const mockSignPendingToken = signPendingToken as jest.MockedFunction<typeof signPendingToken>
const mockPublish = publish as jest.MockedFunction<typeof publish>

const mockUserService = {
  addUser: jest.fn(),
  getUser: jest.fn(),
  isEmailAndUsernameTaken: jest.fn(),
  searchByUsername: jest.fn(),
  updatePassword: jest.fn(),
  banUser: jest.fn(),
}

const mockAuthService = {
  verifyCredentials: jest.fn(),
  issueTokenPair: jest.fn(),
  rotateRefreshToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
  createEmailVerificationToken: jest.fn(),
  resendVerification: jest.fn(),
  verifyEmail: jest.fn(),
  createPasswordResetToken: jest.fn(),
  resetPassword: jest.fn(),
  createTwoFactorCode: jest.fn(),
  verifyTwoFactorCode: jest.fn(),
  enableTwoFactor: jest.fn(),
  disableTwoFactor: jest.fn(),
  startGoogleOAuth: jest.fn(),
  resolveGoogleOAuthSession: jest.fn(),
  findOrCreateGoogleUser: jest.fn(),
  completeGoogleAuth: jest.fn(),
}

const controller = new AuthController(mockUserService as never, mockAuthService as never)

function buildApp() {
  const app = express()
  app.use(express.json())
  app.use("/auth", createAuthRouter(controller))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ success: false, error: "Internal server error" })
  })
  return app
}

const app = buildApp()
const USER_ID = "11111111-1111-1111-1111-111111111111"

beforeEach(() => {
  jest.clearAllMocks()
})

// ── GET /auth/google ────────────────────────────────────────────────────────

describe("GET /auth/google", () => {
  it("returns 302 redirect to Google", async () => {
    mockAuthService.startGoogleOAuth.mockReturnValue(
      "https://accounts.google.com/o/oauth2/auth?..."
    )
    const res = await request(app).get("/auth/google")
    expect(res.status).toBe(302)
  })
})

// ── POST /auth/sign-in ──────────────────────────────────────────────────────

describe("POST /auth/sign-in", () => {
  it("returns 200 with tokens on valid credentials", async () => {
    mockAuthService.verifyCredentials.mockResolvedValue({
      id: USER_ID,
      role: "user",
      isBanned: false,
      twoFactorEnabled: false,
    })
    mockAuthService.issueTokenPair.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    })

    const res = await request(app)
      .post("/auth/sign-in")
      .send({ identifier: "alice@e.com", password: "Pass1234" })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toMatchObject({
      token: "access-token",
      refreshToken: "refresh-token",
    })
  })

  it("returns 401 on invalid credentials", async () => {
    mockAuthService.verifyCredentials.mockRejectedValue(
      Object.assign(new Error("Invalid credentials"), { code: "INVALID_CREDENTIALS" })
    )

    const res = await request(app)
      .post("/auth/sign-in")
      .send({ identifier: "wrong@e.com", password: "wrong" })

    expect(res.status).toBe(401)
    expect(res.body.message).toBe("Invalid credentials")
  })

  it("returns 403 when account is banned", async () => {
    mockAuthService.verifyCredentials.mockResolvedValue({
      id: USER_ID,
      role: "user",
      isBanned: true,
      twoFactorEnabled: false,
    })

    const res = await request(app)
      .post("/auth/sign-in")
      .send({ identifier: "banned@e.com", password: "Pass1234" })

    expect(res.status).toBe(403)
    expect(res.body.message).toMatch(/banned/i)
  })

  it("returns 200 with pending 2FA token when 2FA enabled", async () => {
    mockAuthService.verifyCredentials.mockResolvedValue({
      id: USER_ID,
      role: "user",
      isBanned: false,
      twoFactorEnabled: true,
    })
    mockAuthService.createTwoFactorCode.mockResolvedValue({
      code: "123456",
      expiresAt: new Date(Date.now() + 60000),
    })
    mockSignPendingToken.mockReturnValue("mock-pending-token")

    const res = await request(app)
      .post("/auth/sign-in")
      .send({ identifier: "alice@e.com", password: "Pass1234" })

    expect(res.status).toBe(200)
    expect(res.body.data.pendingToken).toBe("mock-pending-token")
  })
})

describe("POST /auth/sign-up", () => {
  it("returns 201 with tokens when sign-up succeeds", async () => {
    mockUserService.isEmailAndUsernameTaken.mockResolvedValue({
      emailTaken: false,
      usernameTaken: false,
    })
    mockUserService.addUser.mockResolvedValue({
      id: USER_ID,
      username: "newuser",
      email: "new@e.com",
      role: "user",
    })
    mockAuthService.createEmailVerificationToken.mockResolvedValue({
      token: "verify-token",
      verifyUrl: "http://localhost/verify-email?token=verify-token",
    })
    mockAuthService.issueTokenPair.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    })

    const res = await request(app)
      .post("/auth/sign-up")
      .send({ username: "newuser", email: "new@e.com", password: "Pass1234" })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(mockPublish).toHaveBeenCalledWith(
      "auth.email_verification",
      expect.objectContaining({ userId: USER_ID })
    )
  })

  it("returns 409 when email is taken", async () => {
    mockUserService.isEmailAndUsernameTaken.mockResolvedValue({
      emailTaken: true,
      usernameTaken: false,
    })

    const res = await request(app)
      .post("/auth/sign-up")
      .send({ username: "newuser", email: "taken@e.com", password: "Pass1234" })

    expect(res.status).toBe(409)
    expect(mockUserService.addUser).not.toHaveBeenCalled()
  })

  it("returns 409 when username is taken", async () => {
    mockUserService.isEmailAndUsernameTaken.mockResolvedValue({
      emailTaken: false,
      usernameTaken: true,
    })

    const res = await request(app)
      .post("/auth/sign-up")
      .send({ username: "taken", email: "new@e.com", password: "Pass1234" })

    expect(res.status).toBe(409)
  })

  it("returns 400 when password does not meet policy", async () => {
    const res = await request(app)
      .post("/auth/sign-up")
      .send({ username: "newuser", email: "new@e.com", password: "short" })

    expect(res.status).toBe(400)
    expect(mockUserService.addUser).not.toHaveBeenCalled()
  })
})

describe("POST /auth/refresh", () => {
  it("returns 200 with rotated tokens", async () => {
    mockAuthService.rotateRefreshToken.mockResolvedValue({
      accessToken: "new-access",
      refreshToken: "new-refresh",
      user: { id: USER_ID, username: "alice" },
    })

    const res = await request(app)
      .post("/auth/refresh")
      .send({ refreshToken: "valid-refresh-token" })

    expect(res.status).toBe(200)
    expect(res.body.data.token).toBe("new-access")
    expect(res.body.data.refreshToken).toBe("new-refresh")
  })

  it("returns 401 on invalid refresh token", async () => {
    mockAuthService.rotateRefreshToken.mockRejectedValue(
      Object.assign(new Error("Invalid refresh token"), { code: "INVALID_REFRESH" })
    )

    const res = await request(app).post("/auth/refresh").send({ refreshToken: "bad-token" })

    expect(res.status).toBe(401)
  })
})

describe("POST /auth/logout", () => {
  it("returns 200 on success", async () => {
    const res = await request(app).post("/auth/logout").send({ refreshToken: "any-token" })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(mockAuthService.revokeRefreshToken).toHaveBeenCalledWith("any-token")
  })
})

// ── Auth error handling (500) ───────────────────────────────────────────────

// ── POST /auth/verify-email ─────────────────────────────────────────────────

describe("POST /auth/verify-email", () => {
  it("returns 200 on successful verification", async () => {
    mockAuthService.verifyEmail.mockResolvedValue(undefined)
    const res = await request(app)
      .post("/auth/verify-email")
      .send({ token: "b5d4a3c2-e1f0-4a5b-9c8d-7e6f5a4b3c2d" })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it("returns 400 when token is missing", async () => {
    const res = await request(app).post("/auth/verify-email").send({})
    expect(res.status).toBe(400)
  })
})

// ── POST /auth/resend-verification ──────────────────────────────────────────

describe("POST /auth/resend-verification", () => {
  it("returns 200 (always, to avoid enumeration)", async () => {
    mockAuthService.resendVerification.mockResolvedValue(undefined)
    const res = await request(app).post("/auth/resend-verification").send({ email: "test@e.com" })
    expect(res.status).toBe(200)
  })

  it("returns 400 when email is missing", async () => {
    const res = await request(app).post("/auth/resend-verification").send({})
    expect(res.status).toBe(400)
  })
})

// ── POST /auth/forgot-password ──────────────────────────────────────────────

describe("POST /auth/forgot-password", () => {
  it("returns 200 (always, to avoid enumeration)", async () => {
    mockAuthService.createPasswordResetToken.mockResolvedValue(undefined)
    const res = await request(app).post("/auth/forgot-password").send({ email: "test@e.com" })
    expect(res.status).toBe(200)
  })

  it("returns 400 when email is missing", async () => {
    const res = await request(app).post("/auth/forgot-password").send({})
    expect(res.status).toBe(400)
  })
})

// ── POST /auth/reset-password ───────────────────────────────────────────────

describe("POST /auth/reset-password", () => {
  it("returns 200 on successful reset", async () => {
    mockAuthService.resetPassword.mockResolvedValue(undefined)
    const res = await request(app)
      .post("/auth/reset-password")
      .send({ token: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", password: "NewPass1234" })
    expect(res.status).toBe(200)
  })

  it("returns 400 when token or password is missing", async () => {
    const res = await request(app).post("/auth/reset-password").send({})
    expect(res.status).toBe(400)
  })
})

// ── POST /auth/2fa/verify-login ─────────────────────────────────────────────

describe("POST /auth/2fa/verify-login", () => {
  beforeEach(() => {
    mockVerifyPendingToken.mockReturnValue(USER_ID)
    mockUserService.getUser.mockResolvedValue({
      id: USER_ID,
      email: "u@e.com",
      username: "u",
      role: "user",
      isBanned: false,
    })
  })

  it("returns 200 with tokens on valid 2FA code", async () => {
    mockAuthService.verifyTwoFactorCode.mockResolvedValue({
      accessToken: "access-token",
      refreshToken: "refresh-token",
    })
    const res = await request(app)
      .post("/auth/2fa/verify-login")
      .send({ pendingToken: "pending-token", code: "123456" })
    expect(res.status).toBe(200)
    expect(res.body.data.token).toBe("access-token")
  })

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app).post("/auth/2fa/verify-login").send({})
    expect(res.status).toBe(400)
  })
})

// ── POST /auth/2fa/resend-login-code ────────────────────────────────────────

describe("POST /auth/2fa/resend-login-code", () => {
  beforeEach(() => {
    mockVerifyPendingToken.mockReturnValue(USER_ID)
    mockUserService.getUser.mockResolvedValue({
      id: USER_ID,
      email: "u@e.com",
      username: "u",
      role: "user",
      isBanned: false,
      twoFactorEnabled: true,
    })
  })

  it("returns 200 on resend", async () => {
    mockAuthService.createTwoFactorCode.mockResolvedValue({
      code: "123456",
      expiresAt: new Date(Date.now() + 60000),
    })
    const res = await request(app)
      .post("/auth/2fa/resend-login-code")
      .send({ pendingToken: "pending-token" })
    expect(res.status).toBe(200)
  })
})

// ── POST /auth/2fa/send-code ────────────────────────────────────────────────

describe("POST /auth/2fa/send-code", () => {
  beforeEach(() => {
    mockUserService.getUser.mockResolvedValue({
      id: USER_ID,
      email: "user@e.com",
      username: "user",
    })
  })

  it("returns 200 on send", async () => {
    mockVerifyToken.mockReturnValue({ sub: USER_ID, role: "user", jti: "jti-1" })
    mockAuthService.createTwoFactorCode.mockResolvedValue({
      code: "123456",
      expiresAt: new Date(Date.now() + 60000),
    })
    const res = await request(app)
      .post("/auth/2fa/send-code")
      .set("Authorization", "Bearer valid-token")
    expect(res.status).toBe(200)
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).post("/auth/2fa/send-code")
    expect(res.status).toBe(401)
  })
})

// ── POST /auth/2fa/enable ───────────────────────────────────────────────────

describe("POST /auth/2fa/enable", () => {
  it("returns 200 on enable", async () => {
    mockVerifyToken.mockReturnValue({ sub: USER_ID, role: "user", jti: "jti-1" })
    mockAuthService.enableTwoFactor.mockResolvedValue(undefined)
    const res = await request(app)
      .post("/auth/2fa/enable")
      .set("Authorization", "Bearer valid-token")
      .send({ code: "123456" })
    expect(res.status).toBe(200)
  })

  it("returns 401 without auth", async () => {
    const res = await request(app).post("/auth/2fa/enable").send({ code: "123456" })
    expect(res.status).toBe(401)
  })
})

// ── POST /auth/2fa/disable ──────────────────────────────────────────────────

describe("POST /auth/2fa/disable", () => {
  it("returns 200 on disable", async () => {
    mockVerifyToken.mockReturnValue({ sub: USER_ID, role: "user", jti: "jti-1" })
    mockAuthService.disableTwoFactor.mockResolvedValue(undefined)
    const res = await request(app)
      .post("/auth/2fa/disable")
      .set("Authorization", "Bearer valid-token")
    expect(res.status).toBe(200)
  })
})

// ── Auth error handling (500) ───────────────────────────────────────────────

describe("auth controller error handling", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  it("returns 500 when signIn service throws unexpected error", async () => {
    mockAuthService.verifyCredentials.mockRejectedValue(new Error("db error"))
    const res = await request(app)
      .post("/auth/sign-in")
      .send({ identifier: "test@e.com", password: "Pass1234" })
    expect(res.status).toBe(500)
  })

  it("returns 500 when signUp service throws unexpected error", async () => {
    mockUserService.isEmailAndUsernameTaken.mockRejectedValue(new Error("db error"))
    const res = await request(app)
      .post("/auth/sign-up")
      .send({ username: "test", email: "test@e.com", password: "Pass1234" })
    expect(res.status).toBe(500)
  })

  it("returns 500 when refresh service throws unexpected error", async () => {
    mockAuthService.rotateRefreshToken.mockRejectedValue(new Error("db error"))
    const res = await request(app).post("/auth/refresh").send({ refreshToken: "some-token" })
    expect(res.status).toBe(500)
  })

  it("returns 500 when verifyEmail service throws unexpected error", async () => {
    mockAuthService.verifyEmail.mockRejectedValue(new Error("db error"))
    const res = await request(app)
      .post("/auth/verify-email")
      .send({ token: "b5d4a3c2-e1f0-4a5b-9c8d-7e6f5a4b3c2d" })
    expect(res.status).toBe(500)
  })

  it("returns 500 when resendVerification service throws unexpected error", async () => {
    mockAuthService.resendVerification.mockRejectedValue(new Error("db error"))
    const res = await request(app).post("/auth/resend-verification").send({ email: "test@e.com" })
    expect(res.status).toBe(500)
  })

  it("returns 500 when forgotPassword service throws unexpected error", async () => {
    mockAuthService.createPasswordResetToken.mockRejectedValue(new Error("db error"))
    const res = await request(app).post("/auth/forgot-password").send({ email: "test@e.com" })
    expect(res.status).toBe(500)
  })

  it("returns 500 when resetPassword service throws unexpected error", async () => {
    mockAuthService.resetPassword.mockRejectedValue(new Error("db error"))
    const res = await request(app)
      .post("/auth/reset-password")
      .send({ token: "a1b2c3d4-e5f6-7890-abcd-ef1234567890", password: "NewPass1234" })
    expect(res.status).toBe(500)
  })

  it("returns 500 when twoFactorVerifyLogin service throws unexpected error", async () => {
    mockAuthService.verifyTwoFactorCode.mockRejectedValue(new Error("db error"))
    const res = await request(app)
      .post("/auth/2fa/verify-login")
      .send({ pendingToken: "some-token", code: "123456" })
    expect(res.status).toBe(500)
  })

  it("returns 500 when twoFactorResendLoginCode service throws unexpected error", async () => {
    mockVerifyPendingToken.mockReturnValue(USER_ID)
    mockUserService.getUser.mockResolvedValue({
      id: USER_ID,
      email: "u@e.com",
      username: "u",
      twoFactorEnabled: true,
    })
    mockAuthService.createTwoFactorCode.mockRejectedValue(new Error("db error"))
    const res = await request(app)
      .post("/auth/2fa/resend-login-code")
      .send({ pendingToken: "some-token" })
    expect(res.status).toBe(500)
  })

  it("returns 500 when twoFactorSendCode service throws unexpected error", async () => {
    mockUserService.getUser.mockResolvedValue({ id: USER_ID, email: "u@e.com", username: "u" })
    mockVerifyToken.mockReturnValue({ sub: USER_ID, role: "user", jti: "jti-1" })
    mockAuthService.createTwoFactorCode.mockRejectedValue(new Error("db error"))
    const res = await request(app)
      .post("/auth/2fa/send-code")
      .set("Authorization", "Bearer valid-token")
    expect(res.status).toBe(500)
  })

  it("returns 500 when twoFactorEnable service throws unexpected error", async () => {
    mockVerifyToken.mockReturnValue({ sub: USER_ID, role: "user", jti: "jti-1" })
    mockAuthService.enableTwoFactor.mockRejectedValue(new Error("db error"))
    const res = await request(app)
      .post("/auth/2fa/enable")
      .set("Authorization", "Bearer valid-token")
      .send({ code: "123456" })
    expect(res.status).toBe(500)
  })

  it("returns 500 when twoFactorDisable service throws unexpected error", async () => {
    mockVerifyToken.mockReturnValue({ sub: USER_ID, role: "user", jti: "jti-1" })
    mockAuthService.disableTwoFactor.mockRejectedValue(new Error("db error"))
    const res = await request(app)
      .post("/auth/2fa/disable")
      .set("Authorization", "Bearer valid-token")
    expect(res.status).toBe(500)
  })
})

describe("GET /auth/validate", () => {
  it("returns 200 with headers when token is valid", async () => {
    mockVerifyToken.mockReturnValue({ sub: USER_ID, role: "user", jti: "jti-1" })
    mockUserService.getUser.mockResolvedValue({
      id: USER_ID,
      isBanned: false,
    } as never)

    const res = await request(app).get("/auth/validate").set("Authorization", "Bearer valid-token")

    expect(res.status).toBe(200)
  })

  it("returns 401 when token is missing", async () => {
    const res = await request(app).get("/auth/validate")
    expect(res.status).toBe(401)
  })

  it("returns 401 when token is invalid", async () => {
    mockVerifyToken.mockImplementation(() => {
      throw new Error("Invalid token")
    })

    const res = await request(app).get("/auth/validate").set("Authorization", "Bearer bad-token")

    expect(res.status).toBe(401)
  })

  it("returns 403 when user is banned", async () => {
    mockVerifyToken.mockReturnValue({ sub: USER_ID, role: "user", jti: "jti-1" })
    mockUserService.getUser.mockResolvedValue({
      id: USER_ID,
      isBanned: true,
    } as never)

    const res = await request(app).get("/auth/validate").set("Authorization", "Bearer token")

    expect(res.status).toBe(403)
  })
})
