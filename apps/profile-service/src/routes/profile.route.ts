import { Router } from "express"
import ProfileController from "../controllers/profile.controller"
import ProfileService from "../services/profile.service"

function createProfileRouter() {
  const router = Router()

  const profileService = new ProfileService()
  const profileController = new ProfileController(profileService)

  // Public
  router.get("/:profileId", (req, res) => profileController.getProfile(req, res))
  router.get("/:profileId/relations", (req, res) => profileController.getRelations(req, res))

  // Protected (JWT required)
  router.post("/", (req, res) => profileController.createProfile(req, res))
  router.patch("/", (req, res) => profileController.updateProfile(req, res))
  router.delete("/", (req, res) => profileController.deleteProfile(req, res))
  router.post("/follow", (req, res) => profileController.follow(req, res))
  router.post("/unfollow", (req, res) => profileController.unfollow(req, res))

  return router
}

export { createProfileRouter }
