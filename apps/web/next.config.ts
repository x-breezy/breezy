import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // The API proxy (app/api/[...path]/route.ts) forwards paths verbatim to the
  // nginx gateway, whose conversation routes require the trailing slash
  // (location /api/conversations/). Without this, Next would 308-redirect
  // "/api/conversations/" -> "/api/conversations", nginx would 301 back, and
  // the Bearer-injecting proxy would be bypassed (401, and POST downgraded to GET).
  skipTrailingSlashRedirect: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
}

export default nextConfig
