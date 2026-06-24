import fs from "node:fs"
import path from "node:path"

import { swaggerSpec as authSpec } from "../apps/auth-service/src/config/swagger"
import { swaggerSpec as profileSpec } from "../apps/profile-service/src/config/swagger"
import { swaggerSpec as postSpec } from "../apps/post-service/src/config/swagger"
import { swaggerSpec as mediaSpec } from "../apps/media-service/src/config/swagger"
import { swaggerSpec as notificationsSpec } from "../apps/notifications-service/src/config/swagger"
import { swaggerSpec as messageSpec } from "../apps/message-service/src/config/swagger"

type OpenAPISpec = {
  openapi?: string
  info?: object
  paths?: Record<string, object>
  components?: {
    schemas?: Record<string, object>
    [key: string]: unknown
  }
  tags?: { name: string; description?: string }[]
}

const specs: OpenAPISpec[] = [
  authSpec,
  profileSpec,
  postSpec,
  mediaSpec,
  notificationsSpec,
  messageSpec,
]

const merged: OpenAPISpec = {
  openapi: "3.0.3",
  info: {
    title: "Breezy API",
    version: "1.0.0",
    description: "Aggregated API documentation for all Breezy microservices.",
  },
  tags: [
    { name: "Auth", description: "Authentication & token management" },
    { name: "Users", description: "User management (admin)" },
    { name: "Reports", description: "Content reports" },
    { name: "Profiles", description: "User profiles & social graph" },
    { name: "Posts", description: "Posts, feed & replies" },
    { name: "Likes", description: "Post likes" },
    { name: "Media", description: "Image & video upload/streaming" },
    { name: "Notifications", description: "Real-time notifications" },
    { name: "Messages", description: "Private conversations & messaging" },
  ],
  paths: {},
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {},
  },
}

// Public paths that don't require authentication via the gateway.
// These are matched exactly against the swagger path keys.
const publicPaths = [
  "/api/auth/sign-in",
  "/api/auth/sign-up",
  "/api/auth/validate",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/verify-email",
  "/api/auth/resend-verification",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/google",
  "/api/auth/google/callback",
  "/api/auth/google/complete",
  "/api/auth/2fa/verify-login",
  "/api/auth/2fa/resend-login-code",
  "/api/media/images/{id}",
  "/api/media/videos/{id}",
  "/api/profiles/batch",
  "/api/profiles/search",
]

for (const spec of specs) {
  if (spec.paths) {
    for (const [path, methods] of Object.entries(spec.paths)) {
      if (!merged.paths![path]) {
        merged.paths![path] = {}
      }
      for (const [method, operation] of Object.entries(methods as object)) {
        const op = operation as Record<string, unknown>
        // Add bearerAuth for protected routes unless the operation already declares security.
        if (!publicPaths.includes(path) && op.security === undefined) {
          op.security = [{ bearerAuth: [] }]
        }
        ;(merged.paths![path] as Record<string, unknown>)[method] = op
      }
    }
  }
  if (spec.components?.schemas) {
    Object.assign(merged.components!.schemas!, spec.components.schemas)
  }
}

const outPath = path.join(__dirname, "../openapi.json")
fs.writeFileSync(outPath, JSON.stringify(merged, null, 2))
console.log(`openapi.json written to ${outPath}`)
