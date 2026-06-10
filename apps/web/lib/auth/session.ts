import { cookies } from "next/headers"
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./auth-cookies"
import { UserRole } from "@/components/profile"

export { ACCESS_COOKIE, REFRESH_COOKIE }

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost"
const MAX_AGE = 60 * 60 * 24 * 7

export async function setSessionCookies(accessToken: string, refreshToken: string): Promise<void> {
  const cookieStore = await cookies()
  const opts = { path: "/", maxAge: MAX_AGE, sameSite: "lax", httpOnly: false } as const
  cookieStore.set(ACCESS_COOKIE, accessToken, opts)
  cookieStore.set(REFRESH_COOKIE, refreshToken, opts)
}

export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_COOKIE)
  cookieStore.delete(REFRESH_COOKIE)
}

export async function getServerAuthHeader(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_COOKIE)?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function getUserId(): Promise<string> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_COOKIE)?.value
  return token ? decodeToken(token)?.userId : ""
}

function decodeToken(token: string): { userId: string; role: UserRole } {
  try {
    const part = token.split(".")[1]
    if (!part) throw new Error("Invalid token")

    const payload = JSON.parse(Buffer.from(part, "base64").toString()) as {
      sub?: string
      role?: UserRole
    }
    if (!payload.sub) throw new Error("Invalid token")

    return { userId: payload.sub, role: payload.role ?? "user" }
  } catch {
    throw new Error("Invalid token")
  }
}
