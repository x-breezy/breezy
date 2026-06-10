import { Redis } from "ioredis"
import { createLogger } from "@breezy/logger"

const logger = createLogger({ service: "auth-service" })

let client: Redis | null = null

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379")
    client.on("error", (err) => logger.error({ err }, "Redis error"))
  }
  return client
}

export async function connectRedis(): Promise<void> {
  await getRedis().ping()
  logger.info("Connected to Redis")
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit()
    client = null
  }
}
