import { Request, Response, NextFunction } from "express"
import type { Role } from "../constants/roles"

export function requireRoles(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const roles = req.user?.roles ?? []
    const ok = roles.some((r) => (allowed as string[]).includes(r))
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
    const hasRole = (req.user?.roles ?? []).some((r) => (elevated as string[]).includes(r))
    if (!isSelf && !hasRole) {
      res.status(403).json({ success: false, error: "Forbidden" })
      return
    }
    next()
  }
}
