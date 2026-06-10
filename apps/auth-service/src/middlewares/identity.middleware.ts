import type { Request, Response, NextFunction } from "express"
import { verifyToken } from "../utils/jwt.util"
import { getPermissions } from "../services/permission.service"
import type { Role } from "../constants/roles"

export function identity(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"]
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ success: false, error: "Unauthorized" })
    return
  }

  try {
    const payload = verifyToken(token)
    const parsedRole = payload.role as Role | undefined
    req.user = {
      id: payload.sub,
      role: parsedRole as Role,
      permissions: getPermissions(parsedRole),
    }
    next()
  } catch {
    res.status(401).json({ success: false, error: "Unauthorized" })
  }
}
