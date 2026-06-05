import { Request, Response, NextFunction } from "express"
import UserService from "../services/user.service"
import type { CreateUserDTO, UpdatePasswordDTO } from "../schemas/user.schema"

class UserController {
  private userService: UserService

  constructor(userService: UserService) {
    this.userService = userService
  }

  async createUser(
    req: Request<Record<string, never>, unknown, CreateUserDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const taken = await this.userService.isEmailAndUsernameTaken(req.body.email, req.body.username)
      if (taken.emailTaken || taken.usernameTaken) {
        res.status(409).json({ message: "Email or username already taken" })
        return
      }

      const user = await this.userService.addUser(req.body)
      // TODO: Create profile inside the profile-service
      res.status(201).json({ success: true, data: user })
    } catch (error) {
      next(error)
    }
  }

  async getUserById(
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = await this.userService.getUser(req.params.id)
      if (!user) {
        res.status(404).json({ message: "User not found" })
        return
      }
      res.status(200).json({ success: true, data: user })
    } catch (error) {
      next(error)
    }
  }

  async updatePassword(
    req: Request<{ id: string }, unknown, UpdatePasswordDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (req.user!.id !== req.params.id) {
      res.status(403).json({ success: false, error: "Forbidden" })
      return
    }

    try {
      await this.userService.updatePassword(req.params.id, req.body.currentPassword, req.body.newPassword)
      res.status(200).json({ success: true })
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === "USER_NOT_FOUND") {
        res.status(404).json({ success: false, error: "User not found" })
        return
      }
      if (code === "INVALID_PASSWORD") {
        res.status(401).json({ success: false, error: "Current password is incorrect" })
        return
      }
      next(error)
    }
  }
}

export default UserController
