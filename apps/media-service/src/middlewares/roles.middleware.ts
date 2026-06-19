import { Request, Response, NextFunction } from "express"
import type { Role } from "../constants/roles"

export function requireRoles(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const role = req.user?.role
    const ok = role !== undefined && (allowed as string[]).includes(role)
    if (!ok) {
      res.status(403).json({ success: false, error: "Forbidden" })
      return
    }
    next()
  }
}

export function requireSelfOrRoles(param: string, ...elevated: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const isSelf = req.params[param] === req.user?.id
    const role = req.user?.role
    const hasRole = role !== undefined && (elevated as string[]).includes(role)
    if (!isSelf && !hasRole) {
      res.status(403).json({ success: false, error: "Forbidden" })
      return
    }
    next()
  }
}
