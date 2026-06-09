import { cookies } from "next/headers"
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./auth-cookies"

export { ACCESS_COOKIE, REFRESH_COOKIE }

export const API_URL = process.env.API_URL ?? "http://localhost"
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
