import type { Request, Response, NextFunction } from "express"
import type { Role } from "../constants/roles"
import type { Permission } from "../constants/permissions"
import { hasPermission } from "../services/permission.service"

/**
 * Gate: caller must have ALL of the given permissions (derived from their roles).
 * Responds 403 if any permission is missing, 401 if no user identity is present.
 *
 * Usage:
 *   router.delete("/:id", identity, requirePermission("post:delete:any"), controller.delete)
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" })
      return
    }

    const roles = (req.user.roles ?? []) as Role[]
    const denied = permissions.find((p) => !hasPermission(roles, p))

    if (denied) {
      res.status(403).json({ success: false, error: "Forbidden", required: denied })
      return
    }

    next()
  }
}

/**
 * Gate: caller must have AT LEAST ONE of the given permissions.
 * Useful for "can do X or Y" checks.
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" })
      return
    }

    const roles = (req.user.roles ?? []) as Role[]
    const granted = permissions.some((p) => hasPermission(roles, p))

    if (!granted) {
      res.status(403).json({ success: false, error: "Forbidden" })
      return
    }

    next()
  }
}
