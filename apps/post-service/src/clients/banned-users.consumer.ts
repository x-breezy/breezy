import amqplib from "amqplib"
import { createLogger } from "@breezy/logger"
import { addBannedUser, removeBannedUser } from "./banned-users"
import { getRedis } from "./redis"

const logger = createLogger({ service: "post-service" })

const EXCHANGE = "breezy.events"
const QUEUE = "post-service.banned-users"
const BINDING_KEYS = ["user.banned", "user.unbanned"]
const BANNED_KEY = "banned:users"

async function syncBannedUsersFromAuthService(): Promise<void> {
  const authUrl = process.env.AUTH_SERVICE_URL ?? "http://localhost:4020"
  try {
    const res = await fetch(`${authUrl}/internal/banned-user-ids`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const body = (await res.json()) as { ids: string[] }
    if (body.ids.length > 0) {
      await getRedis().sadd(BANNED_KEY, ...body.ids)
    }
    logger.info({ count: body.ids.length }, "Banned users cache seeded from auth-service")
  } catch (err) {
    logger.warn({ err }, "Failed to seed banned users cache, starting empty")
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
          await addBannedUser(userId)
          logger.info({ userId }, "Banned user added to cache")
        } else if (msg.fields.routingKey === "user.unbanned") {
          await removeBannedUser(userId)
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
