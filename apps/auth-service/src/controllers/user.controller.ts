import { Request, Response, NextFunction } from "express"
import UserService from "../services/user.service"
import type { CreateUserDTO, UpdatePasswordDTO } from "../schemas/user.schema"
import { GrpcProfileClient } from "../clients/profile.client"

class UserController {
  private userService: UserService
  private profileClient: GrpcProfileClient

  constructor(userService: UserService) {
    this.userService = userService
    this.profileClient = new GrpcProfileClient()
  }

  createUser = async (
    req: Request<Record<string, never>, unknown, CreateUserDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const taken = await this.userService.isEmailAndUsernameTaken(
        req.body.email,
        req.body.username
      )
      if (taken.emailTaken || taken.usernameTaken) {
        res.status(409).json({ success: false, message: "Email or username already taken" })
        return
      }

      const user = await this.userService.addUser(req.body)

      // Create profile via gRPC
      await this.profileClient.createProfile(user.id, user.username, user.role)

      res.status(201).json({ success: true, message: "User created successfully", data: user })
    } catch (error) {
      next(error)
    }
  }

  getUserById = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.userService.getUser(req.params.id)
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" })
        return
      }
      res.status(200).json({ success: true, data: user, message: "User retrieved successfully" })
    } catch (error) {
      next(error)
    }
  }

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getUser(req.user!.id)
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" })
        return
      }
      res.status(200).json({ success: true, data: user })
    } catch (error) {
      next(error)
    }
  }

  getUserByUsername = async (
    req: Request<{ username: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.userService.getUserByUsername(req.params.username)
      if (!user) {
        res.status(404).json({ success: false, message: "User not found" })
        return
      }
      res.status(200).json({ success: true, data: user, message: "User retrieved successfully" })
    } catch (error) {
      next(error)
    }
  }

  banUser = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.userService.banUser(req.params.id)
      res.status(200).json({ success: true, message: "User banned successfully" })
    } catch (error) {
      if ((error as { code?: string }).code === "USER_NOT_FOUND") {
        res.status(404).json({ success: false, message: "User not found" })
        return
      }
      next(error)
    }
  }

  suspendUser = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.userService.suspendUser(req.params.id)
      res.status(200).json({ success: true, message: "User suspended successfully" })
    } catch (error) {
      if ((error as { code?: string }).code === "USER_NOT_FOUND") {
        res.status(404).json({ success: false, message: "User not found" })
        return
      }
      next(error)
    }
  }

  updatePassword = async (
    req: Request<{ id: string }, unknown, UpdatePasswordDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.userService.updatePassword(
        req.params.id,
        req.body.currentPassword,
        req.body.newPassword
      )

      res.status(200).json({ success: true, message: "Password updated successfully" })
    } catch (error) {
      const code = (error as { code?: string }).code

      if (code === "USER_NOT_FOUND") {
        res.status(404).json({ success: false, message: "User not found" })
        return
      }

      if (code === "INVALID_PASSWORD") {
        res.status(401).json({ success: false, message: "Current password is incorrect" })
        return
      }
      next(error)
    }
  }
  search = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = (req.query.q as string | undefined)?.trim() ?? ""
      if (!q) {
        res.status(400).json({ success: false, message: "Query parameter 'q' is required" })
        return
      }
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20))
      const excludeUserId = req.user?.id
      const result = await this.userService.searchByUsername(q, page, limit, excludeUserId)
      res.status(200).json({
        success: true,
        data: { users: result.users, total: result.count, page, limit },
        message: "Search results retrieved successfully",
      })
    } catch (error) {
      next(error)
    }
  }

}

export default UserController
