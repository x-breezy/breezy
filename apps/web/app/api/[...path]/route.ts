import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

const GATEWAY_URL = process.env.GATEWAY_URL ?? "http://localhost:80"

async function proxyRequest(req: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies()
  const token = cookieStore.get("breezy-token")?.value

  const { pathname, search } = new URL(req.url)
  const target = `${GATEWAY_URL}${pathname}${search}`

  const headers = new Headers(req.headers)
  headers.delete("host")
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.arrayBuffer()
      : undefined

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
    redirect: "manual",
  })

  const responseHeaders = new Headers(upstream.headers)
  responseHeaders.delete("transfer-encoding")

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const PATCH = proxyRequest
export const DELETE = proxyRequest
