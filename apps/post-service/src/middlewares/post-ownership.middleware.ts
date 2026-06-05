import type { Request, Response, NextFunction } from "express"
import { PostModel } from "../models/post.model"
import type { Role } from "../constants/roles"

/**
 * Loads the target post by req.params.id and enforces ownership.
 * Passes if the caller is the post's author OR carries one of the elevated roles.
 * Attaches the loaded document to req.post on success to avoid a second DB hit.
 *
 * Usage:
 *   router.delete("/:id", identity, requirePostOwnership(ROLES.MODERATOR, ROLES.ADMIN), controller.delete)
 */
export function requirePostOwnership(...elevated: Role[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const post = await PostModel.findById(req.params.id).exec()

    if (!post) {
      res.status(404).json({ success: false, error: "Not found" })
      return
    }

    const isOwner = post.authorId === req.user?.id
    const hasElevatedRole = (req.user?.roles ?? []).some((r) => (elevated as string[]).includes(r))

    if (!isOwner && !hasElevatedRole) {
      res.status(403).json({ success: false, error: "Forbidden" })
      return
    }

    req.post = post
    next()
  }
}
