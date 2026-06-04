import { Request, Response, NextFunction } from "express"

interface UserRequest {
  id: string
  roles: string[]
}

export function identity(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers["x-user-id"]
  const roles = req.headers["x-roles"]

  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" })
    return
  }

  const parsedRoles = typeof roles === "string" ? roles.split(",") : []

  const user: UserRequest = {
    id: String(userId),
    roles: parsedRoles,
  }

  req.user = user
  next()
}
