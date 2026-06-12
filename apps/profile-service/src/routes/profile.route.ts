import { Router } from "express"
import ProfileController from "../controllers/profile.controller"
import ProfileService from "../services/profile.service"
import { validate } from "../middlewares/validate.middleware"
import { identity } from "../middlewares/identity.middleware"
import { requirePermission } from "../middlewares/roles.middleware"
import { PERMISSIONS } from "../constants/permissions"
import {
  createProfileSchema,
  updateProfileSchema,
  followSchema,
  profileIdParamSchema,
} from "../schema/profile.schema"

function createProfileRouter() {
  const router = Router()

  const profileService = new ProfileService()
  const profileController = new ProfileController(profileService)

  router.get("/search", identity, profileController.search)
  router.get("/batch", profileController.batchGet)

  // Protected — static routes BEFORE /:profileId to avoid param-route swallowing
  router.get(
    "/:profileId",
    identity,
    requirePermission(PERMISSIONS.PROFILE_READ),
    validate(profileIdParamSchema, "params"),
    profileController.getProfile
  )
  router.get(
    "/:profileId/followers",
    identity,
    requirePermission(PERMISSIONS.PROFILE_READ),
    validate(profileIdParamSchema, "params"),
    profileController.getFollowers
  )
  router.get(
    "/:profileId/following",
    identity,
    requirePermission(PERMISSIONS.PROFILE_READ),
    validate(profileIdParamSchema, "params"),
    profileController.getFollowing
  )
  router.post("/", identity, validate(createProfileSchema), profileController.createProfile)
  router.patch(
    "/",
    identity,
    requirePermission(PERMISSIONS.PROFILE_UPDATE_OWN),
    validate(updateProfileSchema),
    profileController.updateProfile
  )
  router.delete(
    "/",
    identity,
    requirePermission(PERMISSIONS.PROFILE_DELETE_OWN),
    profileController.deleteProfile
  )
  router.post(
    "/follow",
    identity,
    requirePermission(PERMISSIONS.FOLLOW_CREATE),
    validate(followSchema),
    profileController.follow
  )
  router.post(
    "/unfollow",
    identity,
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
 *     responses:
 *       200:
 *         description: List of followers.
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
 *     responses:
 *       200:
 *         description: List of followed profiles.
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
 *       200:
 *         description: Profile deleted.
 *       403:
 *         description: Insufficient permissions.
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
 *             type: object
 *             required: [targetId]
 *             properties:
 *               targetId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Followed.
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
 *             type: object
 *             required: [targetId]
 *             properties:
 *               targetId:
 *                 type: string
 *                 format: uuid
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
