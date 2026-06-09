import { Router } from "express"
import AuthController from "../controllers/auth.controller"
import UserService from "../services/user.service"
import AuthService from "../services/auth.service"
import { validate } from "../middlewares/validate.middleware"
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
    validate(resendVerificationSchema),
    authController.resendVerification
  )
  router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword)
  router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword)

  router.post(
    "/2fa/verify-login",
    validate(twoFactorVerifyLoginSchema),
    authController.twoFactorVerifyLogin
  )
  router.post("/2fa/send-code", authController.twoFactorSendCode)
  router.post("/2fa/enable", validate(twoFactorEnableSchema), authController.twoFactorEnable)
  router.post("/2fa/disable", authController.twoFactorDisable)

  return router
}

export { createAuthRouter }
