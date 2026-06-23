import { cookies } from "next/headers"
import { ACCESS_COOKIE } from "@/lib/auth/auth-cookies"
import type { NextRequest } from "next/server"

// Server-side proxy for browser `apiClient` calls.
//
// The access token lives in an httpOnly cookie (breezy-token), so client JS
// cannot read it to set an Authorization header. Every `/api/*` request from
// the browser therefore hits this handler, which reads the cookie server-side
// and forwards the request to the nginx gateway with a Bearer token attached.
// Without it, the gateway's auth_request (and the services' identity
// middleware) reject the unauthenticated request with 401.
//
// The path + query string are forwarded verbatim (note the trailing-slash
// preservation in next.config.ts's skipTrailingSlashRedirect) so gateway
// locations like `location /api/conversations/` still match.

const GATEWAY_URL = process.env.API_URL ?? "http://localhost"

async function proxy(request: NextRequest): Promise<Response> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_COOKIE)?.value

  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("content-length")
  if (token) headers.set("authorization", `Bearer ${token}`)

  const target = `${GATEWAY_URL}${request.nextUrl.pathname}${request.nextUrl.search}`

  const hasBody = request.method !== "GET" && request.method !== "HEAD"

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    // Required by undici/Node when streaming a request body.
    ...(hasBody ? { duplex: "half" } : {}),
    redirect: "manual",
    cache: "no-store",
  } as RequestInit)

  // fetch already decompresses the body; drop encoding/length so the browser
  // doesn't try to decode it again or mismatch the stream length.
  const resHeaders = new Headers(upstream.headers)
  resHeaders.delete("content-encoding")
  resHeaders.delete("content-length")

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: resHeaders,
  })
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE }
