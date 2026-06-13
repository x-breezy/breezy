import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/auth-cookies"

const API_URL = process.env.API_URL ?? "http://localhost"

const MAX_AGE = 60 * 60 * 24 * 7

// Authenticated users are redirected away from these paths (unless server action)
const AUTH_ONLY_PATHS = ["/sign-in", "/sign-up", "/forgot-password", "/two-factor", "/google-username"]

// Always accessible regardless of auth state (token-based flows work for both auth states)
const ALWAYS_ACCESSIBLE = ["/verify-email", "/reset-password"]

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

function setSession(res: NextResponse, token: string, refreshToken: string) {
  const opts = {
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax" as const,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  }
  res.cookies.set(ACCESS_COOKIE, token, opts)
  res.cookies.set(REFRESH_COOKIE, refreshToken, opts)
}

export default async function proxy(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  const { pathname } = request.nextUrl

  const isAuthOnlyPath = AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p))
  const isAlwaysAccessible = ALWAYS_ACCESSIBLE.some((p) => pathname.startsWith(p))

  const redirectToSignIn = () => {
    const res = NextResponse.redirect(new URL("/sign-in", request.url))
    res.cookies.delete(ACCESS_COOKIE)
    res.cookies.delete(REFRESH_COOKIE)
    return res
  }

  const valid = token ? !isTokenExpired(token) : false

  if (!valid && refreshToken) {
    const refreshed = await refreshTokens(refreshToken)
    if (refreshed) {
      const res = isAuthOnlyPath
        ? NextResponse.redirect(new URL("/", request.url))
        : NextResponse.next()
      setSession(res, refreshed.token, refreshed.refreshToken)
      return res
    }
    if (!isAuthOnlyPath && !isAlwaysAccessible) return redirectToSignIn()
    return NextResponse.next()
  }

  if (!valid) {
    if (!isAuthOnlyPath && !isAlwaysAccessible) return redirectToSignIn()
    return NextResponse.next()
  }

  const isServerAction = request.headers.has("next-action")
  if (isAuthOnlyPath && !isServerAction) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|icon|assets|brand|images).*)"],
}
