import { createLogger } from "@breezy/logger"

const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL ?? "http://localhost:4010"

const logger = createLogger({ service: "auth-service" })

export async function checkProfileExists(userId: string): Promise<boolean> {
  try {
    const res = await fetch(`${PROFILE_SERVICE_URL}/profiles/internal/${userId}`, { method: "GET" })
    return res.status === 200
  } catch (err) {
    logger.error({ err, userId }, "Failed to check if profile exists")
    return false
  }
}
