import type { Request, Response, NextFunction } from "express"
import { verifyJwt } from "../utils/jwt"
import { getPermissions } from "../services/permission.service"
import type { Role } from "../constants/roles"

const COOKIE_NAME = "breezy-token"

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {}
  return Object.fromEntries(
    header.split(";").map((pair) => {
      const [name, ...rest] = pair.trim().split("=")
      return [name, rest.join("=")]
    })
  )
}

export function identity(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"]
  const token =
    authHeader?.startsWith("Bearer ") ? authHeader.slice(7)
    : parseCookies(req.headers["cookie"])[COOKIE_NAME] ?? null

  if (!token) {
    res.status(401).json({ success: false, error: "Unauthorized" })
    return
  }

  try {
    const { sub, role } = verifyJwt(token)
    const parsedRole = role as Role
    req.user = {
      id: sub,
      role: parsedRole,
      permissions: getPermissions(parsedRole),
    }
    next()
  } catch {
    res.status(401).json({ success: false, error: "Unauthorized" })
  }
}
