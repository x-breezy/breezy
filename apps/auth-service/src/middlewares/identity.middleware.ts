import type { Request, Response, NextFunction } from "express"
import { getPermissions } from "../services/permission.service"
import type { Role } from "../constants/roles"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function identity(req: Request, res: Response, next: NextFunction): void {
  const userId = req.headers["x-user-id"]
  const role = req.headers["x-role"]

  if (!userId || !UUID_RE.test(String(userId))) {
    res.status(401).json({ success: false, error: "Unauthorized" })
    return
  }

  const parsedRole = (typeof role === "string" ? role : undefined) as Role | undefined

  req.user = {
    id: String(userId),
    role: parsedRole as Role,
    permissions: getPermissions(parsedRole),
  }

  next()
}
