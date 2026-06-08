import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const TOKEN_COOKIE = "breezy-token"
const AUTH_PATHS = ["/sign-in", "/sign-up"]
const API_URL = process.env.API_URL ?? "http://localhost"

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

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value
  const { pathname } = request.nextUrl

  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p))

  if (!token) {
    if (!isAuthPath) return NextResponse.redirect(new URL("/sign-in", request.url))
    return NextResponse.next()
  }

  const valid = await validateToken(token)

  if (!valid) {
    const response = NextResponse.redirect(new URL("/sign-in", request.url))
    response.cookies.delete(TOKEN_COOKIE)
    return response
  }

  if (isAuthPath) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|icon|assets|brand|images).*)"],
}
