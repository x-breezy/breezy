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

  router.post(
    "/",
    identity,
    requirePermission(PERMISSIONS.USER_CREATE),
    validate(createUserSchema),
    userController.createUser
  )
  router.get("/me", identity, requirePermission(PERMISSIONS.USER_ME), userController.getMe)
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

/**
 * @openapi
 * /api/auth/users:
 *   post:
 *     summary: Create a user (admin)
 *     tags: [Users]
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
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Insufficient permissions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/users/{id}:
 *   get:
 *     summary: Get user by id
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/users/{id}/ban:
 *   patch:
 *     summary: Ban a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User banned.
 *       403:
 *         description: Insufficient permissions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/users/{id}/suspend:
 *   patch:
 *     summary: Suspend a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User suspended.
 *       403:
 *         description: Insufficient permissions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/users/{id}/password:
 *   patch:
 *     summary: Update password
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 example: NewPass1234!
 *     responses:
 *       200:
 *         description: Password updated.
 *       403:
 *         description: Insufficient permissions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
