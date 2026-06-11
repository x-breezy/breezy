import jwt from "jsonwebtoken"
import { randomBytes, createHash, createPublicKey, randomUUID } from "crypto"
import type { Role } from "../constants/roles"

export interface TokenClaims {
  sub: string
  role: Role
}

export interface TokenPayload extends TokenClaims {
  jti: string
}

function loadPem(envKey: string, pathKey: string): string {
  const filePath = process.env[pathKey]
  if (filePath) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("fs") as typeof import("fs")).readFileSync(filePath, "utf-8").trim()
  }
  return (process.env[envKey] ?? "")
    .replace(/^"{3}\s*/, "")
    .replace(/\s*"{3}$/, "")
    .replace(/\\n/g, "\n")
    .trim()
}

const getPrivatePem = () => loadPem("JWT_PRIVATE_KEY", "JWT_PRIVATE_KEY_PATH")
const getPublicPem = () => loadPem("JWT_PUBLIC_KEY", "JWT_PUBLIC_KEY_PATH")
const getKid = () => process.env.JWT_KID ?? "key-1"

const expiresIn = (process.env.JWT_EXPIRES_IN ?? "15m") as jwt.SignOptions["expiresIn"]

export const REFRESH_TOKEN_TTL_MS = Number(
  process.env.REFRESH_TOKEN_TTL_MS ?? 7 * 24 * 60 * 60 * 1000
)

export function signToken(claims: TokenClaims): string {
  const jti = randomUUID()
  return jwt.sign({ ...claims, jti }, getPrivatePem(), {
    algorithm: "RS256",
    expiresIn,
    keyid: getKid(),
  })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getPublicPem(), { algorithms: ["RS256"] }) as TokenPayload
}

/** pending (2FA) token stays HS256, internal only, never leaves auth-service. */
export function signPendingToken(userId: string): string {
  const secret = process.env.JWT_SECRET ?? "changeme"
  return jwt.sign({ sub: userId, purpose: "two-factor" }, secret, { expiresIn: "10m" })
}

export function verifyPendingToken(token: string): string {
  const secret = process.env.JWT_SECRET ?? "changeme"
  const payload = jwt.verify(token, secret) as { sub: string; purpose: string }
  if (payload.purpose !== "two-factor") throw new Error("Invalid token purpose")
  return payload.sub
}

export function generateRefreshToken(): string {
  return randomBytes(32).toString("hex")
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function getJwks(): { keys: object[] } {
  const pubKey = createPublicKey({ key: getPublicPem(), format: "pem" })
  const jwk = pubKey.export({ format: "jwk" }) as Record<string, unknown>
  return { keys: [{ ...jwk, kid: getKid(), alg: "RS256", use: "sig" }] }
}
