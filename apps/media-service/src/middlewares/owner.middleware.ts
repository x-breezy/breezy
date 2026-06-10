import type { Request, Response, NextFunction } from "express"
import type { Model } from "mongoose"
import type { Role } from "../constants/roles"

/**
 * Factory that produces an ownership guard for any Mongoose model with an `ownerId` field.
 * Passes if the caller is the resource owner OR carries one of the elevated role.
 * Attaches the loaded document to req.post on success to avoid a second DB hit downstream.
 *
 * Usage:
 *   router.delete("/:id", identity, requireOwnership(ImageModel, ROLES.MODERATOR, ROLES.ADMIN), controller.deleteImage)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function requireOwnership(model: Model<any>, ...elevated: Role[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const resource = await model.findById(req.params.id).exec()

    if (!resource) {
      res.status(404).json({ success: false, error: "Not found" })
      return
    }

    const isOwner = resource.ownerId === req.user?.id
    const hasRole = elevated.includes(req.user?.role as Role)

    if (!isOwner && !hasRole) {
      res.status(403).json({ success: false, error: "Forbidden" })
      return
    }

    req.post = resource
    next()
  }
}
