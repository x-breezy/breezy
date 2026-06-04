import { Router } from "express"
import UserController from "../controllers/user.controller"
import UserService from "../services/user.service"

function createUserRouter() {
  const router = Router()

  const userService = new UserService()
  const userController = new UserController(userService)

  router.post("/", (req, res) => userController.addUser(req, res))
  router.get("/email/:email", (req, res) => userController.getUserByEmail(req, res))
  router.get("/:id", (req, res) => userController.getUser(req, res))
  router.patch("/:id", (req, res) => userController.updateUser(req, res))
  router.delete("/:id", (req, res) => userController.deleteUser(req, res))

  return router
}

export { createUserRouter }
