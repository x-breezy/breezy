import { Request, Response, NextFunction } from "express"

export function identity(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"]
  const roles = req.headers["x-roles"]

  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" })
    return
  }

  req.user = {
    id: String(userId),
    roles: typeof roles === "string" ? roles.split(",") : [],
  }

  next()
}
