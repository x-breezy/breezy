import jwt from "jsonwebtoken"
import { readFileSync } from "fs"

function loadPem(envKey: string, pathKey: string): string {
  const filePath = process.env[pathKey]
  if (filePath) return readFileSync(filePath, "utf-8").trim()
  return (process.env[envKey] ?? "")
    .replace(/^"{3}\s*/, "")
    .replace(/\s*"{3}$/, "")
    .replace(/\\n/g, "\n")
    .trim()
}

const getPublicPem = () => loadPem("JWT_PUBLIC_KEY", "JWT_PUBLIC_KEY_PATH")

export interface JwtClaims {
  sub: string
  role: string
  jti?: string
}

export function verifyJwt(token: string): JwtClaims {
  const decoded = jwt.verify(token, getPublicPem(), { algorithms: ["RS256"] }) as jwt.JwtPayload & {
    role: string
  }
  return { sub: decoded.sub as string, role: decoded.role, jti: decoded.jti }
}
