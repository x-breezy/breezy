import { Request, Response, NextFunction } from "express"
import { getPermissions } from "../constants/rbac"
import type { Role } from "../constants/roles"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function identity(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers["x-user-id"]
  const roles = req.headers["x-roles"]

  if (!userId || !UUID_RE.test(String(userId))) {
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
