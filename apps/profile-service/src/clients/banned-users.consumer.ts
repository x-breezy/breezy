import amqplib from "amqplib"
import { createLogger } from "@breezy/logger"

const logger = createLogger({ service: "profile-service" })

const EXCHANGE = "breezy.events"
const QUEUE = "profile-service.banned-users"
const BINDING_KEYS = ["user.banned", "user.unbanned"]

const bannedUsers = new Set<string>()

export function getBannedUserIds(): Set<string> {
  return bannedUsers
}

async function syncBannedUsersFromAuthService(): Promise<void> {
  const authUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4020"
  const maxAttempts = 5
  const delayMs = 1000

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${authUrl}/internal/banned-user-ids`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as { ids: string[] }
      for (const id of body.ids) bannedUsers.add(id)
      logger.info({ count: body.ids.length }, "Banned users cache seeded from auth-service")
      return
    } catch (err) {
      if (attempt === maxAttempts) {
        logger.warn({ err }, "Failed to seed banned users cache, starting empty")
        return
      }
      logger.debug({ attempt, err }, "Retrying banned users cache seed")
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

export async function startBannedUsersConsumer(): Promise<void> {
  await syncBannedUsersFromAuthService()
  try {
    const url = process.env.RABBITMQ_URL ?? "amqp://breezy:breezy@localhost:5672"
    const conn = await amqplib.connect(url)
    const channel = await conn.createChannel()

    await channel.assertExchange(EXCHANGE, "topic", { durable: true })
    await channel.assertQueue(QUEUE, { durable: true })

    for (const key of BINDING_KEYS) {
      await channel.bindQueue(QUEUE, EXCHANGE, key)
    }

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return
      try {
        const payload = JSON.parse(msg.content.toString()) as { userId: string }
        const { userId } = payload
        if (msg.fields.routingKey === "user.banned") {
          bannedUsers.add(userId)
          logger.info({ userId }, "Banned user added to cache")
        } else if (msg.fields.routingKey === "user.unbanned") {
          bannedUsers.delete(userId)
          logger.info({ userId }, "Unbanned user removed from cache")
        }
        channel.ack(msg)
      } catch (err) {
        logger.error({ err }, "Failed to process ban event")
        channel.nack(msg, false, false)
      }
    })

    logger.info("Banned users consumer started")
  } catch (err) {
    logger.warn({ err }, "Failed to start banned users consumer")
  }
}
