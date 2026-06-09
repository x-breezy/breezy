import { Router } from "express"
import AuthController from "../controllers/auth.controller"
import UserService from "../services/user.service"
import AuthService from "../services/auth.service"
import { validate } from "../middlewares/validate.middleware"
import {
  emailSendRateLimit,
  authenticatedEmailRateLimit,
} from "../middlewares/email-rate-limit.middleware"
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
  twoFactorEnableSchema,
} from "../schemas/auth.schema"

function createAuthRouter(
  authController: AuthController = new AuthController(new UserService(), new AuthService())
): Router {
  const router = Router()

  router.post("/sign-in", validate(signInSchema), authController.signIn)
  router.post("/sign-up", validate(signUpSchema), authController.signUp)
  router.get("/validate", authController.validate)
  router.post("/refresh", validate(refreshSchema), authController.refresh)
  router.post("/logout", validate(logoutSchema), authController.logout)

  router.post("/verify-email", validate(verifyEmailSchema), authController.verifyEmail)
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
  router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword)

  router.post(
    "/2fa/verify-login",
    validate(twoFactorVerifyLoginSchema),
    authController.twoFactorVerifyLogin
  )
  router.post("/2fa/send-code", authenticatedEmailRateLimit, authController.twoFactorSendCode)
  router.post("/2fa/enable", validate(twoFactorEnableSchema), authController.twoFactorEnable)
  router.post("/2fa/disable", authController.twoFactorDisable)

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
 *     description: Used internally by nginx auth_request. Returns 200 with x-user-id and x-roles headers on success.
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
 */
