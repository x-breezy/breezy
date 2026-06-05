import { Router } from "express"
import UserController from "../controllers/user.controller"
import UserService from "../services/user.service"
import { validate } from "../middlewares/validate.middleware"
import { identity } from "../middlewares/identity.middleware"
import { requirePermission, requireSelfOrPermission } from "../middlewares/roles.middleware"
import { PERMISSIONS } from "../constants/permissions"
import { createUserSchema, updatePasswordSchema, userIdParamSchema } from "../schemas/user.schema"

function createUserRouter(
  userController: UserController = new UserController(new UserService())
): Router {
  const router = Router({ mergeParams: true })

  router.post("/", validate(createUserSchema), userController.createUser)
  router.get(
    "/:id",
    identity,
    requirePermission(PERMISSIONS.USER_READ),
    validate(userIdParamSchema, "params"),
    userController.getUserById
  )
  router.patch(
    "/:id/ban",
    identity,
    requirePermission(PERMISSIONS.USER_BAN),
    validate(userIdParamSchema, "params"),
    userController.banUser
  )
  router.patch(
    "/:id/suspend",
    identity,
    requirePermission(PERMISSIONS.USER_SUSPEND),
    validate(userIdParamSchema, "params"),
    userController.suspendUser
  )
  router.patch(
    "/:id/password",
    identity,
    requireSelfOrPermission("id"),
    validate(userIdParamSchema, "params"),
    validate(updatePasswordSchema),
    userController.updatePassword
  )

  return router
}

export { createUserRouter }
