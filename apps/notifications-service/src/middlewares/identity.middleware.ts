import type { Request, Response, NextFunction } from "express"
import { getPermissions } from "../services/permission.service"
import type { Role } from "../constants/roles"

export function identity(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers["x-user-id"]
  const role = req.headers["x-role"]

  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" })
    return
  }

  const parsedRole = (typeof role === "string" ? role : undefined) as Role

  req.user = {
    id: String(userId),
    role: parsedRole,
    permissions: getPermissions(parsedRole),
  }

  next()
}
