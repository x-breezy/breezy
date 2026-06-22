import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./auth-cookies"

const API_URL = process.env.API_URL ?? "http://localhost"

function isTokenExpired(token: string): boolean {
  try {
    const part = token.split(".")[1]
    if (!part) return true
    const payload = JSON.parse(Buffer.from(part, "base64url").toString()) as { exp?: number }
    return !payload.exp || payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

async function refreshTokens(
  refreshToken: string
): Promise<{ token: string; refreshToken: string } | null> {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return null
    const body = await res.json()
    const next = body?.data as { token?: string; refreshToken?: string } | undefined
    if (!next?.token || !next?.refreshToken) return null
    return { token: next.token, refreshToken: next.refreshToken }
  } catch {
    return null
  }
}

async function clearSession(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.delete(ACCESS_COOKIE)
  cookieStore.delete(REFRESH_COOKIE)
}

async function setSession(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  token: string,
  refreshToken: string
) {
  const opts = {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  }
  cookieStore.set(ACCESS_COOKIE, token, opts)
  cookieStore.set(REFRESH_COOKIE, refreshToken, opts)
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_COOKIE)?.value
  if (!token) return {}

  if (isTokenExpired(token)) {
    const rt = cookieStore.get(REFRESH_COOKIE)?.value
    if (rt) {
      const refreshed = await refreshTokens(rt)
      if (refreshed) {
        await setSession(cookieStore, refreshed.token, refreshed.refreshToken)
        return { Authorization: `Bearer ${refreshed.token}` }
      }
    }
    await clearSession(cookieStore)
    redirect("/sign-in")
  }

  return { Authorization: `Bearer ${token}` }
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = await getAuthHeaders()
  return fetch(`${API_URL}${url}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  })
}
