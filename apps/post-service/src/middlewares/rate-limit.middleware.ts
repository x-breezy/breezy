import rateLimit, { ipKeyGenerator } from "express-rate-limit"
import type { Request } from "express"

const byUser = (req: Request) => req.user?.id ?? ipKeyGenerator(req.ip ?? "unknown")

const defaults = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests.", code: "RATE_LIMITED" },
}

export const readLimit = rateLimit({
  ...defaults,
  windowMs: 60_000,
  max: 120,
  keyGenerator: byUser,
})
export const writeLimit = rateLimit({
  ...defaults,
  windowMs: 60_000,
  max: 80,
  keyGenerator: byUser,
})
export const searchLimit = rateLimit({
  ...defaults,
  windowMs: 60_000,
  max: 100,
  keyGenerator: byUser,
})
