import jwt from "jsonwebtoken"
import { randomBytes, createHash } from "crypto"
import type { Role } from "../constants/roles"

export interface TokenPayload {
  sub: string
  roles: Role[]
}

const secret = process.env.JWT_SECRET ?? "changeme"
const expiresIn = (process.env.JWT_EXPIRES_IN ?? "15m") as jwt.SignOptions["expiresIn"]

/** Refresh-token lifetime in milliseconds (default 7 days). */
export const REFRESH_TOKEN_TTL_MS = Number(
  process.env.REFRESH_TOKEN_TTL_MS ?? 7 * 24 * 60 * 60 * 1000
)

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, secret, { expiresIn })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, secret) as TokenPayload
}

export function signPendingToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: "two-factor" }, secret, { expiresIn: "10m" })
}

export function verifyPendingToken(token: string): string {
  const payload = jwt.verify(token, secret) as { sub: string; purpose: string }
  if (payload.purpose !== "two-factor") throw new Error("Invalid token purpose")
  return payload.sub
}

/** Opaque refresh token handed to the client; never stored in plaintext. */
export function generateRefreshToken(): string {
  return randomBytes(32).toString("hex")
}

/** SHA-256 of a refresh token; this is what we persist and look up by. */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}
