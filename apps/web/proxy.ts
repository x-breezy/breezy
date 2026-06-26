import { type NextRequest, NextResponse } from "next/server"
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/auth-cookies"

const API_URL = process.env.API_URL ?? "http://localhost"

const COOKIE_OPTS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
}

function isExpired(token: string): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString()
    ) as { exp?: number }
    return !payload.exp || payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

async function refresh(
  refreshToken: string
): Promise<{ token: string; refreshToken: string } | null> {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return null
    const body = (await res.json()) as { data?: { token?: string; refreshToken?: string } }
    if (!body.data?.token || !body.data?.refreshToken) return null
    return { token: body.data.token, refreshToken: body.data.refreshToken }
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(ACCESS_COOKIE)?.value
  const rt = request.cookies.get(REFRESH_COOKIE)?.value

  if (!token) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  if (!isExpired(token)) {
    return NextResponse.next()
  }

  // Token expired — attempt silent refresh before redirecting
  if (!rt) {
    return NextResponse.redirect(new URL("/sign-in", request.url))
  }

  const refreshed = await refresh(rt)
  if (!refreshed) {
    const response = NextResponse.redirect(new URL("/sign-in", request.url))
    response.cookies.delete(ACCESS_COOKIE)
    response.cookies.delete(REFRESH_COOKIE)
    return response
  }

  const response = NextResponse.next()
  response.cookies.set(ACCESS_COOKIE, refreshed.token, COOKIE_OPTS)
  response.cookies.set(REFRESH_COOKIE, refreshed.refreshToken, COOKIE_OPTS)
  return response
}

export const config = {
  matcher: ["/(app)/(.*)"],
}
