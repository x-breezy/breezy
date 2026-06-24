import rateLimit, { ipKeyGenerator } from "express-rate-limit"
import type { Request } from "express"

const byUser = (req: Request) => req.user?.id ?? ipKeyGenerator(req.ip ?? "unknown")
const byIp = (req: Request) => ipKeyGenerator(req.ip ?? "unknown")

const defaults = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests.", code: "RATE_LIMITED" },
}

export const readLimit = rateLimit({
  ...defaults,
  windowMs: 60_000,
  max: 600,
  keyGenerator: byUser,
})
export const writeLimit = rateLimit({
  ...defaults,
  windowMs: 60_000,
  max: 300,
  keyGenerator: byUser,
})
export const uploadLimit = rateLimit({
  ...defaults,
  windowMs: 60_000,
  max: 100,
  keyGenerator: byUser,
})
export const videoUploadLimit = rateLimit({
  ...defaults,
  windowMs: 60_000,
  max: 50,
  keyGenerator: byUser,
})
export const publicReadLimit = rateLimit({
  ...defaults,
  windowMs: 60_000,
  max: 600,
  keyGenerator: byIp,
})
