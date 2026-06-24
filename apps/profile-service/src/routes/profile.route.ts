import { Router } from "express"
import ProfileController from "../controllers/profile.controller"
import ProfileService from "../services/profile.service"
import { validate } from "../middlewares/validate.middleware"
import { identity } from "../middlewares/identity.middleware"
import { requirePermission } from "../middlewares/roles.middleware"
import {
  readLimit,
  writeLimit,
  searchLimit,
  followLimit,
  publicReadLimit,
} from "../middlewares/rate-limit.middleware"
import { PERMISSIONS } from "../constants/permissions"
import {
  createProfileSchema,
  updateProfileSchema,
  followSchema,
  profileIdParamSchema,
  usernameParamSchema,
} from "../schema/profile.schema"

function createProfileRouter() {
  const router = Router()

  const profileService = new ProfileService()
  const profileController = new ProfileController(profileService)

  router.get("/search", identity, profileController.search)
  router.get("/batch", profileController.batchGet)
  router.get("/internal/batch", profileController.internalBatchGet)
  router.get("/internal/:profileId", readLimit, profileController.getProfile)

  // Protected, static routes BEFORE /:profileId to avoid param-route swallowing
  router.get(
    "/by-username/:username",
    identity,
    readLimit,
    requirePermission(PERMISSIONS.PROFILE_READ),
    validate(usernameParamSchema, "params"),
    profileController.getProfileByUsername
  )
  router.get(
    "/:profileId",
    identity,
    readLimit,
    requirePermission(PERMISSIONS.PROFILE_READ),
    validate(profileIdParamSchema, "params"),
    profileController.getProfile
  )
  router.get(
    "/:profileId/is-following",
    identity,
    readLimit,
    requirePermission(PERMISSIONS.PROFILE_READ),
    validate(profileIdParamSchema, "params"),
    profileController.isFollowing
  )
  router.get(
    "/:profileId/followers",
    identity,
    readLimit,
    requirePermission(PERMISSIONS.PROFILE_READ),
    validate(profileIdParamSchema, "params"),
    profileController.getFollowers
  )
  router.get(
    "/:profileId/following",
    identity,
    readLimit,
    requirePermission(PERMISSIONS.PROFILE_READ),
    validate(profileIdParamSchema, "params"),
    profileController.getFollowing
  )
  router.get(
    "/:profileId/suggestions",
    identity,
    readLimit,
    requirePermission(PERMISSIONS.PROFILE_READ),
    validate(profileIdParamSchema, "params"),
    profileController.getFollowSuggestions
  )
  router.post(
    "/",
    identity,
    writeLimit,
    validate(createProfileSchema),
    profileController.createProfile
  )
  router.patch(
    "/",
    identity,
    writeLimit,
    requirePermission(PERMISSIONS.PROFILE_UPDATE_OWN),
    validate(updateProfileSchema),
    profileController.updateProfile
  )
  router.delete(
    "/",
    identity,
    writeLimit,
    requirePermission(PERMISSIONS.PROFILE_DELETE_OWN),
    profileController.deleteProfile
  )
  router.post(
    "/follow",
    identity,
    followLimit,
    requirePermission(PERMISSIONS.FOLLOW_CREATE),
    validate(followSchema),
    profileController.follow
  )
  router.post(
    "/unfollow",
    identity,
    followLimit,
    requirePermission(PERMISSIONS.FOLLOW_DELETE_OWN),
    validate(followSchema),
    profileController.unfollow
  )

  return router
}

export { createProfileRouter }

/**
 * @openapi
 * /api/profiles/{profileId}:
 *   get:
 *     summary: Get a profile
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Profile found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/profiles/{profileId}/is-following:
 *   get:
 *     summary: Check if the current user follows a profile
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Follow status.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     isFollowing: { type: boolean }
 *
 * /api/profiles/{profileId}/followers:
 *   get:
 *     summary: Get followers of a profile
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Paginated list of follower IDs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     followers: { type: array, items: { type: string, format: uuid } }
 *                     count: { type: integer }
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *
 * /api/profiles/{profileId}/following:
 *   get:
 *     summary: Get profiles followed by a profile
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Paginated list of followed profile IDs.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     following: { type: array, items: { type: string, format: uuid } }
 *                     count: { type: integer }
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *
 * /api/profiles/{profileId}/suggestions:
 *   get:
 *     summary: Get follow suggestions for a profile
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: profileId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 3 }
 *     responses:
 *       200:
 *         description: List of suggested profiles.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Profile' } }
 *
 * /api/profiles:
 *   post:
 *     summary: Create a profile
 *     tags: [Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProfileInput'
 *     responses:
 *       201:
 *         description: Profile created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *   patch:
 *     summary: Update own profile
 *     tags: [Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileInput'
 *     responses:
 *       200:
 *         description: Profile updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *   delete:
 *     summary: Delete own profile
 *     tags: [Profiles]
 *     responses:
 *       204:
 *         description: Profile deleted.
 *       403:
 *         description: Insufficient permissions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/profiles/search:
 *   get:
 *     summary: Search profiles by username/name
 *     tags: [Profiles]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated search results.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     profiles: { type: array, items: { $ref: '#/components/schemas/Profile' } }
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *
 * /api/profiles/batch:
 *   get:
 *     summary: Batch fetch profiles by IDs
 *     tags: [Profiles]
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated profile IDs
 *     responses:
 *       200:
 *         description: List of profiles.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Profile' } }
 *
 * /api/profiles/by-username/{username}:
 *   get:
 *     summary: Get a profile by username
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Profile found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/Profile'
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/profiles/follow:
 *   post:
 *     summary: Follow a profile
 *     tags: [Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FollowInput'
 *     responses:
 *       201:
 *         description: Followed.
 *       400:
 *         description: Cannot follow yourself.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Already following.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/profiles/unfollow:
 *   post:
 *     summary: Unfollow a profile
 *     tags: [Profiles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FollowInput'
 *     responses:
 *       200:
 *         description: Unfollowed.
 *       404:
 *         description: Follow relationship not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
