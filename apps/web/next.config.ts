import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const MEDIA_SERVICE_URL = process.env.MEDIA_SERVICE_URL ?? "http://localhost:4050"
const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL ?? "http://localhost:4060"

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/media/images/:path*",
        destination: `${MEDIA_SERVICE_URL}/images/:path*`,
      },
      {
        source: "/api/media/videos/:path*",
        destination: `${MEDIA_SERVICE_URL}/videos/:path*`,
      },
      {
        source: "/api/media/:path*",
        destination: `${MEDIA_SERVICE_URL}/:path*`,
      },
      {
        source: "/api/notifications/stream",
        destination: `${NOTIFICATIONS_SERVICE_URL}/notifications/stream`,
      },
      {
        source: "/api/notifications/:path*",
        destination: `${NOTIFICATIONS_SERVICE_URL}/notifications/:path*`,
      },
    ]
  },
}

export default withNextIntl(nextConfig)
