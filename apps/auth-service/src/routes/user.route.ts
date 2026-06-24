import { Router } from "express"
import UserController from "../controllers/user.controller"
import UserService from "../services/user.service"
import { validate } from "../middlewares/validate.middleware"
import { identity } from "../middlewares/identity.middleware"
import { requirePermission, requireSelfOrPermission } from "../middlewares/roles.middleware"
import { PERMISSIONS } from "../constants/permissions"
import {
  createUserSchema,
  updatePasswordSchema,
  userIdParamSchema,
  usernameParamSchema,
} from "../schemas/user.schema"
import { readLimit, writeLimit, searchLimit } from "../middlewares/rate-limit.middleware"

function createUserRouter(
  userController: UserController = new UserController(new UserService())
): Router {
  const router = Router({ mergeParams: true })

  router.post(
    "/",
    identity,
    writeLimit,
    requirePermission(PERMISSIONS.USER_CREATE),
    validate(createUserSchema),
    userController.createUser
  )
  router.get(
    "/",
    identity,
    readLimit,
    requirePermission(PERMISSIONS.USER_READ),
    userController.listAll
  )
  router.get("/search", identity, searchLimit, userController.search)
  router.get(
    "/sanctioned",
    identity,
    readLimit,
    requirePermission(PERMISSIONS.USER_BAN),
    userController.listSanctioned
  )
  router.patch(
    "/:id/unban",
    identity,
    writeLimit,
    requirePermission(PERMISSIONS.USER_BAN),
    validate(userIdParamSchema, "params"),
    userController.unbanUser
  )
  router.get(
    "/me",
    identity,
    readLimit,
    requirePermission(PERMISSIONS.USER_ME),
    userController.getMe
  )
  router.get(
    "/by-username/:username",
    identity,
    requirePermission(PERMISSIONS.USER_READ),
    validate(usernameParamSchema, "params"),
    userController.getUserByUsername
  )
  router.get(
    "/:id",
    identity,
    readLimit,
    requirePermission(PERMISSIONS.USER_READ),
    validate(userIdParamSchema, "params"),
    userController.getUserById
  )
  router.patch(
    "/:id/ban",
    identity,
    writeLimit,
    requirePermission(PERMISSIONS.USER_BAN),
    validate(userIdParamSchema, "params"),
    userController.banUser
  )
  router.patch(
    "/:id/password",
    identity,
    writeLimit,
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
 *   get:
 *     summary: List all users (paginated, admin)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated user list.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 users: { type: array, items: { $ref: '#/components/schemas/User' } }
 *                 total: { type: integer, example: 100 }
 *                 page: { type: integer, example: 1 }
 *                 limit: { type: integer, example: 20 }
 *       403:
 *         description: Insufficient permissions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
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
 *                 example: NewPass1234!
 *               role:
 *                 type: string
 *                 enum: [user, moderator, admin]
 *                 default: user
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
 * /api/auth/users/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Current user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *
 * /api/auth/users/search:
 *   get:
 *     summary: Search users by username or email
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Matching users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: array, items: { $ref: '#/components/schemas/User' } }
 *
 * /api/auth/users/sanctioned:
 *   get:
 *     summary: List banned/sanctioned users (admin)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Sanctioned users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: array, items: { $ref: '#/components/schemas/User' } }
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
 * /api/auth/users/{id}/unban:
 *   patch:
 *     summary: Unban a user
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
 *         description: User unbanned.
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
 * /api/auth/users/by-username/{username}:
 *   get:
 *     summary: Get user by username
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
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
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: OldPass1234!
 *               newPassword:
 *                 type: string
 *                 example: NewPass1234!
 *     responses:
 *       200:
 *         description: Password updated.
 *       400:
 *         description: Invalid current password.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Insufficient permissions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
