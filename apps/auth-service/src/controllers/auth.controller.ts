import { Request, Response, NextFunction } from "express"
import UserService from "../services/user.service"
import { signToken, verifyToken } from "../utils/jwt.util"
import type { SignInDTO, SignUpDTO } from "../schemas/auth.schema"

class AuthController {
  private userService: UserService

  constructor(userService: UserService) {
    this.userService = userService
  }

  signIn = async (
    req: Request<Record<string, never>, unknown, SignInDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = await this.userService.signIn(req.body)

      if (user.isBanned) {
        res.status(403).json({ success: false, message: "Account is banned" })
        return
      }
      if (user.isSuspended) {
        res.status(403).json({ success: false, message: "Account is suspended" })
        return
      }

      const token = signToken({ sub: user.id, roles: user.roles })
      res.status(200).json({ success: true, data: { token, user } })
    } catch (error) {
      if ((error as { code?: string }).code === "INVALID_CREDENTIALS") {
        res.status(401).json({ success: false, message: "Invalid email or password" })
        return
      }
      next(error)
    }
  }

  signUp = async (
    req: Request<Record<string, never>, unknown, SignUpDTO>,
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
      const token = signToken({ sub: user.id, roles: user.roles })
      res.status(201).json({ success: true, data: { token, user } })
    } catch (error) {
      next(error)
    }
  }

  validate = (req: Request, res: Response): void => {
    const authHeader = req.headers["authorization"]
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

    if (!token) {
      res.status(401).json({ success: false, message: "Missing token" })
      return
    }

    try {
      const payload = verifyToken(token)
      res.set("X-User-Id", payload.sub)
      res.set("X-Roles", payload.roles.join(","))
      res.status(200).json({ success: true })
    } catch {
      res.status(401).json({ success: false, message: "Invalid or expired token" })
    }
  }
}

export default AuthController
