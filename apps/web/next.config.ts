import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const nextConfig: NextConfig = {
  // Browser /api/* calls are handled by the Bearer-injecting proxy at
  // app/api/[...path]/route.ts (the access token lives in an httpOnly cookie
  // the client JS can't read). A plain rewrite can't add that header, so it is
  // intentionally not used here.
  //
  // The proxy forwards paths verbatim to the nginx gateway, whose conversation
  // routes require the trailing slash (location /api/conversations/). Without
  // this, Next would 308-redirect "/api/conversations/" -> "/api/conversations",
  // the gateway would fall through to the web upstream, and the request would
  // bypass auth (401, and POST downgraded to GET).
  skipTrailingSlashRedirect: true,
  output: "standalone",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1/api/:path*",
      },
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
}

export default withNextIntl(nextConfig)
