import amqplib from "amqplib"
import { createLogger } from "@breezy/logger"

const logger = createLogger({ service: "post-service" })

const EXCHANGE = "breezy.events"
const QUEUE = "post-service.banned-users"
const BINDING_KEYS = ["user.banned", "user.unbanned"]

const bannedUserIds = new Set<string>()

export async function getBannedUserIds(): Promise<Set<string>> {
  return bannedUserIds
}

async function seed(): Promise<void> {
  const authUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4020"
  const maxAttempts = 5

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${authUrl}/internal/banned-user-ids`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as { ids: string[] }
      for (const id of body.ids) bannedUserIds.add(id)
      logger.info({ count: body.ids.length }, "Banned users seeded from auth-service")
      return
    } catch (err) {
      if (attempt === maxAttempts) {
        logger.warn({ err }, "Failed to seed banned users, starting empty")
        return
      }
      logger.debug({ attempt, err }, "Retrying banned users seed")
      await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** (attempt - 1), 10_000)))
    }
  }
}

export async function startBannedUsersConsumer(): Promise<void> {
  await seed()
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
        const { userId } = JSON.parse(msg.content.toString()) as { userId: string }
        if (msg.fields.routingKey === "user.banned") {
          bannedUserIds.add(userId)
          logger.info({ userId }, "Banned user added")
        } else if (msg.fields.routingKey === "user.unbanned") {
          bannedUserIds.delete(userId)
          logger.info({ userId }, "Unbanned user removed")
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
