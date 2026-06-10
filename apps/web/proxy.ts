import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/auth-cookies"

const API_URL = process.env.API_URL ?? "http://localhost"

const MAX_AGE = 60 * 60 * 24 * 7
const AUTH_PATHS = [
  "/sign-in",
  "/sign-up",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/two-factor",
]

async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/auth/validate`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return res.ok
  } catch {
    return false
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

function setSession(res: NextResponse, token: string, refreshToken: string) {
  const opts = { path: "/", maxAge: MAX_AGE, sameSite: "lax" as const, httpOnly: false }
  res.cookies.set(ACCESS_COOKIE, token, opts)
  res.cookies.set(REFRESH_COOKIE, refreshToken, opts)
}

export default async function proxy(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  const { pathname } = request.nextUrl
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p))

  const redirectToSignIn = () => {
    const res = NextResponse.redirect(new URL("/sign-in", request.url))
    res.cookies.delete(ACCESS_COOKIE)
    res.cookies.delete(REFRESH_COOKIE)
    return res
  }

  const valid = token ? await validateToken(token) : false

  if (!valid && refreshToken) {
    const refreshed = await refreshTokens(refreshToken)
    if (refreshed) {
      const res = isAuthPath
        ? NextResponse.redirect(new URL("/", request.url))
        : NextResponse.next()
      setSession(res, refreshed.token, refreshed.refreshToken)
      return res
    }
    return isAuthPath ? NextResponse.next() : redirectToSignIn()
  }

  if (!valid) {
    if (!isAuthPath) return redirectToSignIn()
    return NextResponse.next()
  }

  const isServerAction = request.headers.has("next-action")

  if (isAuthPath && !isServerAction) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|icon|assets|brand|images).*)"],
}
