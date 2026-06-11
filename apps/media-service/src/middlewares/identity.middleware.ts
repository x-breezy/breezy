import { Request, Response, NextFunction } from "express"
import { verifyJwt } from "../utils/jwt"

export function identity(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"]
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ success: false, error: "Unauthorized" })
    return
  }

  try {
    const { sub, role } = verifyJwt(token)
    req.user = { id: sub, role }
    next()
  } catch {
    res.status(401).json({ success: false, error: "Unauthorized" })
  }
}
