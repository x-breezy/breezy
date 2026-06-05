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

  // Protected
  router.get(
    "/:profileId",
    identity,
    requirePermission(PERMISSIONS.PROFILE_READ),
    validate(profileIdParamSchema, "params"),
    profileController.getProfile
  )
  router.get(
    "/:profileId/relations",
    identity,
    requirePermission(PERMISSIONS.PROFILE_READ),
    validate(profileIdParamSchema, "params"),
    profileController.getRelations
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
