import { Router } from "express"
import AuthController from "../controllers/auth.controller"
import UserService from "../services/user.service"
import { validate } from "../middlewares/validate.middleware"
import { signInSchema, signUpSchema } from "../schemas/auth.schema"

function createAuthRouter(
  authController: AuthController = new AuthController(new UserService())
): Router {
  const router = Router()

  router.post("/sign-in", validate(signInSchema), authController.signIn)
  router.post("/sign-up", validate(signUpSchema), authController.signUp)
  router.get("/validate", authController.validate)

  return router
}

export { createAuthRouter }
