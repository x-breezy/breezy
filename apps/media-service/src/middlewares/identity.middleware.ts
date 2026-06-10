import { Request, Response, NextFunction } from "express"

export function identity(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"]
  const role = req.headers["x-role"]

  if (!userId) {
    res.status(401).json({ success: false, error: "Unauthorized" })
    return
  }

  req.user = {
    id: String(userId),
    role: typeof role === "string" ? role : undefined,
  }

  next()
}
