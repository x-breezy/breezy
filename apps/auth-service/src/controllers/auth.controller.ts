import { Request, Response, NextFunction } from "express"
import UserService from "../services/user.service"
import AuthService from "../services/auth.service"
import { signPendingToken, verifyPendingToken, verifyToken, getJwks } from "../utils/jwt.util"
import { publish } from "../clients/rabbitmq"
import { GrpcProfileClient } from "../clients/profile.client"
import type {
  SignInDTO,
  SignUpDTO,
  VerifyEmailDTO,
  ResendVerificationDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  RefreshDTO,
  LogoutDTO,
  TwoFactorVerifyLoginDTO,
  TwoFactorResendLoginDTO,
  TwoFactorEnableDTO,
  GoogleCompleteDTO,
} from "../schemas/auth.schema"

const APP_URL = process.env.APP_URL ?? "http://localhost:3000"

class AuthController {
  private userService: UserService
  private authService: AuthService
  private profileClient: GrpcProfileClient

  constructor(userService: UserService, authService: AuthService = new AuthService()) {
    this.userService = userService
    this.authService = authService
    this.profileClient = new GrpcProfileClient()
  }

  signIn = async (
    req: Request<Record<string, never>, unknown, SignInDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.authService.verifyCredentials(req.body)

      if (user.isBanned) {
        res.status(403).json({ success: false, message: "Account is banned" })
        return
      }
      if (user.isSuspended) {
        res.status(403).json({ success: false, message: "Account is suspended" })
        return
      }

      if (user.twoFactorEnabled) {
        const { code, expiresAt } = await this.authService.createTwoFactorCode(user.id)
        void publish("auth.2fa_code", {
          userId: user.id,
          email: user.email,
          username: user.username,
          code,
          expiresAt: expiresAt.toISOString(),
        })
        const pendingToken = signPendingToken(user.id)
        res.status(200).json({ success: true, requiresTwoFactor: true, data: { pendingToken } })
        return
      }

      const { accessToken, refreshToken } = await this.authService.issueTokenPair({
        sub: user.id,
        role: user.role,
      })
      res.status(200).json({ success: true, data: { token: accessToken, refreshToken, user } })
    } catch (error) {
      if ((error as { code?: string }).code === "INVALID_CREDENTIALS") {
        res.status(401).json({ success: false, message: "Invalid credentials" })
        return
      }
      next(error)
    }
  }

  signUp = async (
    req: Request<Record<string, never>, unknown, SignUpDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const taken = await this.userService.isEmailAndUsernameTaken(
        req.body.email,
        req.body.username
      )
      if (taken.emailTaken || taken.usernameTaken) {
        res.status(409).json({ success: false, message: "Email or username already taken" })
        return
      }

      const user = await this.userService.addUser(req.body)

      await this.profileClient.createProfile(user.id, user.username, user.role)

      const { token, verifyUrl } = await this.authService.createEmailVerificationToken(user.id)
      void publish("auth.email_verification", {
        userId: user.id,
        email: user.email,
        username: user.username,
        token,
        verifyUrl,
      })

      const { accessToken, refreshToken } = await this.authService.issueTokenPair({
        sub: user.id,
        role: user.role,
      })
      res.status(201).json({ success: true, data: { token: accessToken, refreshToken, user } })
    } catch (error) {
      next(error)
    }
  }

  validate = async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers["authorization"]
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

    if (!token) {
      res.status(401).json({ success: false, message: "Missing token" })
      return
    }

    try {
      const payload = verifyToken(token)
      const user = await this.userService.getUser(payload.sub)

      if (user?.isBanned) {
        res.status(403).json({ success: false, message: "User is banned", code: "USER_BANNED" })
        return
      }
      if (user?.isSuspended) {
        res
          .status(403)
          .json({ success: false, message: "User is suspended", code: "USER_SUSPENDED" })
        return
      }

      res.set("X-User-Id", payload.sub)
      res.set("X-Role", payload.role)
      res.status(200).json({ success: true })
    } catch {
      res.status(401).json({ success: false, message: "Invalid or expired token" })
    }
  }

  refresh = async (
    req: Request<Record<string, never>, unknown, RefreshDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { accessToken, refreshToken, user } = await this.authService.rotateRefreshToken(
        req.body.refreshToken
      )
      res.status(200).json({ success: true, data: { token: accessToken, refreshToken, user } })
    } catch (error) {
      if ((error as { code?: string }).code === "INVALID_REFRESH") {
        res.status(401).json({ success: false, message: "Invalid or expired refresh token" })
        return
      }
      next(error)
    }
  }

  logout = async (
    req: Request<Record<string, never>, unknown, LogoutDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.authService.revokeRefreshToken(req.body.refreshToken)
      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  verifyEmail = async (
    req: Request<Record<string, never>, unknown, VerifyEmailDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.authService.verifyEmail(req.body.token)
      res.status(200).json({ success: true })
    } catch (error) {
      if ((error as { code?: string }).code === "INVALID_TOKEN") {
        res.status(400).json({ success: false, message: "Invalid or expired verification link" })
        return
      }
      next(error)
    }
  }

  resendVerification = async (
    req: Request<Record<string, never>, unknown, ResendVerificationDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.authService.resendVerification(req.body.email)
      if (result) {
        void publish("auth.email_verification", {
          userId: result.userId,
          email: req.body.email,
          username: result.username,
          token: result.token,
          verifyUrl: result.verifyUrl,
        })
      }
      // Always 200 to avoid leaking which emails exist / are verified.
      res
        .status(200)
        .json({ success: true, message: "If that account needs verification, an email was sent" })
    } catch (error) {
      next(error)
    }
  }

  forgotPassword = async (
    req: Request<Record<string, never>, unknown, ForgotPasswordDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.authService.createPasswordResetToken(req.body.email)
      if (result) {
        void publish("auth.forgot_password", {
          userId: result.userId,
          email: req.body.email,
          username: result.username,
          resetToken: result.token,
          resetUrl: result.resetUrl,
        })
      }
      // Always return 200 to avoid email enumeration
      res
        .status(200)
        .json({ success: true, message: "If that email exists, a reset link was sent" })
    } catch (error) {
      next(error)
    }
  }

  resetPassword = async (
    req: Request<Record<string, never>, unknown, ResetPasswordDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.authService.resetPassword(req.body.token, req.body.password)
      res.status(200).json({ success: true })
    } catch (error) {
      if ((error as { code?: string }).code === "INVALID_TOKEN") {
        res.status(400).json({ success: false, message: "Invalid or expired reset link" })
        return
      }
      next(error)
    }
  }

  twoFactorVerifyLogin = async (
    req: Request<Record<string, never>, unknown, TwoFactorVerifyLoginDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      let userId: string
      try {
        userId = verifyPendingToken(req.body.pendingToken)
      } catch {
        res.status(401).json({ success: false, message: "Invalid or expired session" })
        return
      }

      await this.authService.verifyTwoFactorCode(userId, req.body.code)

      const user = await this.userService.getUser(userId)
      if (!user) {
        res.status(401).json({ success: false, message: "User not found" })
        return
      }

      const { accessToken, refreshToken } = await this.authService.issueTokenPair({
        sub: user.id,
        role: user.role,
      })
      res.status(200).json({ success: true, data: { token: accessToken, refreshToken, user } })
    } catch (error) {
      if ((error as { code?: string }).code === "INVALID_2FA_CODE") {
        res.status(401).json({ success: false, message: "Invalid or expired code" })
        return
      }
      if ((error as { code?: string }).code === "TWO_FACTOR_LOCKED") {
        res.status(429).json({ success: false, message: "Too many attempts, try again later" })
        return
      }
      next(error)
    }
  }

  twoFactorResendLoginCode = async (
    req: Request<Record<string, never>, unknown, TwoFactorResendLoginDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      let userId: string
      try {
        userId = verifyPendingToken(req.body.pendingToken)
      } catch {
        res.status(401).json({ success: false, message: "Invalid or expired session" })
        return
      }

      const user = await this.userService.getUser(userId)
      if (!user || !user.twoFactorEnabled) {
        res.status(401).json({ success: false, message: "Invalid or expired session" })
        return
      }

      const { code, expiresAt } = await this.authService.createTwoFactorCode(userId)
      void publish("auth.2fa_code", {
        userId,
        email: user.email,
        username: user.username,
        code,
        expiresAt: expiresAt.toISOString(),
      })

      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  twoFactorSendCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers["x-user-id"] as string
      const user = await this.userService.getUser(userId)
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" })
        return
      }

      const { code, expiresAt } = await this.authService.createTwoFactorCode(userId)
      void publish("auth.2fa_code", {
        userId,
        email: user.email,
        username: user.username,
        code,
        expiresAt: expiresAt.toISOString(),
      })

      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  twoFactorEnable = async (
    req: Request<Record<string, never>, unknown, TwoFactorEnableDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.headers["x-user-id"] as string
      await this.authService.verifyTwoFactorCode(userId, req.body.code)
      await this.authService.enableTwoFactor(userId)
      res.status(200).json({ success: true })
    } catch (error) {
      if ((error as { code?: string }).code === "INVALID_2FA_CODE") {
        res.status(401).json({ success: false, message: "Invalid or expired code" })
        return
      }
      if ((error as { code?: string }).code === "TWO_FACTOR_LOCKED") {
        res.status(429).json({ success: false, message: "Too many attempts, try again later" })
        return
      }
      next(error)
    }
  }

  twoFactorDisable = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.headers["x-user-id"] as string
      await this.authService.disableTwoFactor(userId)
      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  googleRedirect = async (_req: Request, res: Response): Promise<void> => {
    try {
      const authUrl = await this.authService.startGoogleOAuth()
      res.redirect(authUrl)
    } catch {
      res.redirect(`${APP_URL}/sign-in?error=oauth`)
    }
  }

  googleCallback = async (req: Request, res: Response): Promise<void> => {
    const { code, state, error } = req.query as Record<string, string>

    if (error || !code || !state) {
      res.redirect(`${APP_URL}/sign-in?error=oauth`)
      return
    }

    try {
      const codeVerifier = await this.authService.resolveGoogleOAuthSession(state)
      if (!codeVerifier) {
        res.redirect(`${APP_URL}/sign-in?error=oauth`)
        return
      }

      const result = await this.authService.findOrCreateGoogleUser(code, codeVerifier)
      const isProd = process.env.NODE_ENV === "production"
      const cookieOpts = { httpOnly: true, secure: isProd, sameSite: "lax" as const }

      if (result.isNewUser) {
        res.cookie("pending_google_token", result.pendingToken, {
          ...cookieOpts,
          maxAge: 15 * 60 * 1000,
        })
        res.redirect(`${APP_URL}/google-username`)
        return
      }

      const { user } = result
      const { accessToken, refreshToken } = await this.authService.issueTokenPair({
        sub: user.id,
        role: user.role,
      })
      res.cookie("breezy-token", accessToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 })
      res.cookie("breezy-refresh", refreshToken, {
        ...cookieOpts,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      res.redirect(`${APP_URL}/`)
    } catch {
      res.redirect(`${APP_URL}/sign-in?error=oauth`)
    }
  }

  googleComplete = async (
    req: Request<Record<string, never>, unknown, GoogleCompleteDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { pendingToken, username } = req.body
      const { user, created, googleClaims } = await this.authService.completeGoogleAuth(
        pendingToken,
        username
      )

      if (created) {
        await this.profileClient.createProfile(user.id, user.username, user.role, {
          firstName: googleClaims.firstName,
          lastName: googleClaims.lastName,
          avatarUrl: googleClaims.picture,
        })
        if (!user.isEmailVerified) {
          const { token, verifyUrl } = await this.authService.createEmailVerificationToken(user.id)
          void publish("auth.email_verification", {
            userId: user.id,
            email: user.email,
            username: user.username,
            token,
            verifyUrl,
          })
        }
      }

      const { accessToken, refreshToken } = await this.authService.issueTokenPair({
        sub: user.id,
        role: user.role,
      })

      res.status(201).json({ success: true, data: { token: accessToken, refreshToken, user } })
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === "USERNAME_TAKEN") {
        res.status(409).json({ success: false, message: "Username already taken" })
        return
      }
      if (code === "INVALID_TOKEN" || (error as Error).message?.includes("Invalid token")) {
        res.status(401).json({ success: false, message: "Session expired, please sign in again" })
        return
      }
      next(error)
    }
  }

  jwks = (_req: Request, res: Response): void => {
    res.json(getJwks())
  }
}

export default AuthController
