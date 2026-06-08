import jwt from "jsonwebtoken"
import type { Role } from "../constants/roles"

export interface TokenPayload {
  sub: string
  roles: Role[]
}

const secret = process.env.JWT_SECRET ?? "changeme"
const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"]

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, secret, { expiresIn })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, secret) as TokenPayload
}
