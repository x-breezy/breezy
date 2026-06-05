import type { Request, Response, NextFunction } from "express"
import type { Permission } from "../constants/permissions"

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" })
      return
    }
    const denied = permissions.find((p) => !req.user!.permissions.includes(p))
    if (denied) {
      res.status(403).json({ success: false, error: "Forbidden", required: denied })
      return
    }
    next()
  }
}

export function requireSelfOrPermission(param: string, elevatedPermission?: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" })
      return
    }
    const isSelf = req.params[param] === req.user.id
    const hasPermission = elevatedPermission
      ? req.user.permissions.includes(elevatedPermission)
      : false
    if (!isSelf && !hasPermission) {
      res.status(403).json({ success: false, error: "Forbidden" })
      return
    }
    next()
  }
}

export function requireOwnership<T extends { authorId: string }>(
  fetch: (req: Request) => Promise<T | null>,
  elevatedPermission: Permission
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const resource = await fetch(req)
    if (!resource) {
      res.status(404).json({ success: false, error: "Not found" })
      return
    }
    const isOwner = resource.authorId === req.user?.id
    const hasElevated = req.user?.permissions.includes(elevatedPermission) ?? false
    if (!isOwner && !hasElevated) {
      res.status(403).json({ success: false, error: "Forbidden" })
      return
    }
    next()
  }
}
