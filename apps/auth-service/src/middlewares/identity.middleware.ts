import type { Request, Response, NextFunction } from "express"
import { verifyToken } from "../utils/jwt.util"
import { getPermissions } from "../services/permission.service"
import { getRedis } from "../clients/redis"
import { createLogger } from "@breezy/logger"
import type { Role } from "../constants/roles"

const logger = createLogger({ service: "auth-service" })

export async function identity(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers["authorization"]
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ success: false, error: "Unauthorized" })
    return
  }

  try {
    const payload = verifyToken(token)

    try {
      const banned = await getRedis().get(`banned:${payload.sub}`)
      if (banned) {
        res.status(403).json({ success: false, error: "Forbidden", code: "ACCOUNT_BANNED" })
        return
      }
    } catch (redisErr) {
      // fail-open, a Redis outage must not take down authenticated traffic
      logger.warn({ err: redisErr }, "Redis unavailable for ban check, failing open")
    }

    req.user = {
      id: payload.sub,
      role: payload.role as Role,
      permissions: getPermissions(payload.role as Role),
    }
    next()
  } catch {
    res.status(401).json({ success: false, error: "Unauthorized" })
  }
}
