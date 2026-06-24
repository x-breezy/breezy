import { Router } from "express"
import AuthController from "../controllers/auth.controller"
import UserService from "../services/user.service"
import AuthService from "../services/auth.service"
import { validate } from "../middlewares/validate.middleware"
import { identity } from "../middlewares/identity.middleware"
import {
  emailSendRateLimit,
  authenticatedEmailRateLimit,
} from "../middlewares/email-rate-limit.middleware"
import { strictLimit, authWriteLimit } from "../middlewares/rate-limit.middleware"
import {
  signInSchema,
  signUpSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
  logoutSchema,
  twoFactorVerifyLoginSchema,
  twoFactorResendLoginSchema,
  twoFactorEnableSchema,
  googleCompleteSchema,
} from "../schemas/auth.schema"

function createAuthRouter(
  authController: AuthController = new AuthController(new UserService(), new AuthService())
): Router {
  const router = Router()

  router.post("/sign-in", strictLimit, validate(signInSchema), authController.signIn)
  router.post("/sign-up", strictLimit, validate(signUpSchema), authController.signUp)
  router.get("/validate", authController.validate)
  router.post("/refresh", authWriteLimit, validate(refreshSchema), authController.refresh)
  router.post("/logout", authWriteLimit, validate(logoutSchema), authController.logout)

  router.post("/verify-email", strictLimit, validate(verifyEmailSchema), authController.verifyEmail)
  router.post(
    "/resend-verification",
    emailSendRateLimit,
    validate(resendVerificationSchema),
    authController.resendVerification
  )
  router.post(
    "/forgot-password",
    emailSendRateLimit,
    validate(forgotPasswordSchema),
    authController.forgotPassword
  )
  router.post(
    "/reset-password",
    authenticatedEmailRateLimit,
    validate(resetPasswordSchema),
    authController.resetPassword
  )
  router.get("/google", authWriteLimit, authController.googleRedirect)
  router.get("/google/callback", authWriteLimit, authController.googleCallback)
  router.post(
    "/google/complete",
    authWriteLimit,
    validate(googleCompleteSchema),
    authController.googleComplete
  )

  router.post(
    "/2fa/verify-login",
    strictLimit,
    validate(twoFactorVerifyLoginSchema),
    authController.twoFactorVerifyLogin
  )
  router.post(
    "/2fa/resend-login-code",
    emailSendRateLimit,
    validate(twoFactorResendLoginSchema),
    authController.twoFactorResendLoginCode
  )
  router.post(
    "/2fa/send-code",
    identity,
    authenticatedEmailRateLimit,
    authController.twoFactorSendCode
  )
  router.post(
    "/2fa/enable",
    identity,
    strictLimit,
    validate(twoFactorEnableSchema),
    authController.twoFactorEnable
  )
  router.post("/2fa/disable", identity, strictLimit, authController.twoFactorDisable)

  router.post("/profile-created", authController.profileCreated)

  return router
}

export { createAuthRouter }

/**
 * @openapi
 * /api/auth/sign-in:
 *   post:
 *     summary: Sign in
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Test1234!
 *     responses:
 *       200:
 *         description: Authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/sign-up:
 *   post:
 *     summary: Sign up
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: Test1234!
 *     responses:
 *       201:
 *         description: Account created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         description: Email or username already taken.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/validate:
 *   get:
 *     summary: Validate JWT (internal)
 *     description: Used internally by nginx auth_request. Returns 200 with x-user-id and x-role headers on success.
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *           example: Bearer eyJhbGci...
 *     responses:
 *       200:
 *         description: Token valid.
 *       401:
 *         description: Token missing or invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: dGhpcyBpcyBhIHJlZnJlc2gtdG9rZW4...
 *     responses:
 *       200:
 *         description: New tokens issued.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid or expired refresh token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/logout:
 *   post:
 *     summary: Revoke tokens and sign out
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Signed out.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Signed out successfully" }
 *       401:
 *         description: Invalid token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *       400:
 *         description: Invalid or expired token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent if account exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with reset token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 example: NewPass1234!
 *     responses:
 *       200:
 *         description: Password updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *       400:
 *         description: Invalid or expired token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/google:
 *   get:
 *     summary: Start Google OAuth sign-in
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects to Google consent screen.
 *
 * /api/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirects back to frontend.
 *
 * /api/auth/google/complete:
 *   post:
 *     summary: Complete Google sign-in with pending token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       409:
 *         description: Email already used with password account.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/2fa/verify-login:
 *   post:
 *     summary: Verify 2FA code during login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pendingToken, code]
 *             properties:
 *               pendingToken:
 *                 type: string
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid or expired code.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/2fa/resend-login-code:
 *   post:
 *     summary: Resend 2FA login code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pendingToken]
 *             properties:
 *               pendingToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Code sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *
 * /api/auth/2fa/send-code:
 *   post:
 *     summary: Send 2FA setup code to authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Setup code sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 secret:
 *                   type: string
 *
 * /api/auth/2fa/enable:
 *   post:
 *     summary: Enable 2FA with setup code
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: 2FA enabled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *       400:
 *         description: Invalid code.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/2fa/disable:
 *   post:
 *     summary: Disable 2FA
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA disabled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *
 * /api/auth/profile-created:
 *   post:
 *     summary: Notify auth-service that a profile was created
 *     tags: [Auth]
 *     description: Called internally after profile creation to mark the user account complete.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Acknowledged.
 */
