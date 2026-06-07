import type { Request, Response, NextFunction } from "express"
import { getPermissions } from "../services/permission.service"
import type { Role } from "../constants/roles"

export function identity(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers["x-user-id"]
  const roles = req.headers["x-roles"]

  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" })
    return
  }

  const parsedRoles = (typeof roles === "string" ? roles.split(",") : []) as Role[]

  req.user = {
    id: String(userId),
    roles: parsedRoles,
    permissions: getPermissions(parsedRoles),
  }

  next()
}
