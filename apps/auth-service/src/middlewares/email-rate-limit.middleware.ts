import rateLimit, { ipKeyGenerator } from "express-rate-limit"
import type { Request } from "express"

// Keyed by email for unauthenticated routes, by IP for authenticated ones.
export const emailSendRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  keyGenerator: (req: Request) =>
    (req.body?.email as string | undefined) ?? ipKeyGenerator(req.ip ?? "unknown"),
  message: {
    message: "Please wait before requesting another email.",
    code: "EMAIL_SEND_RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

export const authenticatedEmailRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? "unknown"),
  message: {
    message: "Please wait before requesting another code.",
    code: "EMAIL_SEND_RATE_LIMITED",
  },
  standardHeaders: true,
  legacyHeaders: false,
})
