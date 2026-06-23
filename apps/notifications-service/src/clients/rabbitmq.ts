import amqplib from "amqplib"
import { createLogger } from "@breezy/logger"

const logger = createLogger({ service: "notifications-service" })

const EXCHANGE = "breezy.events"
const QUEUE = "notifications.queue"
const DLQ = "notifications.dlq"

const MAX_RETRY_DELAY = 30000
const INITIAL_RETRY_DELAY = 1000

let consuming = false

async function connectWithRetry(url: string) {
  let delay = INITIAL_RETRY_DELAY
  for (let attempt = 1; ; attempt++) {
    try {
      const conn = await amqplib.connect(url)
      const channel = await conn.createChannel()
      return { conn, channel }
    } catch (err) {
      logger.warn({ err, attempt, delay }, "RabbitMQ connection failed, retrying")
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay = Math.min(delay * 2, MAX_RETRY_DELAY)
    }
  }
}

export async function startConsuming(
  handler: (routingKey: string, payload: unknown) => Promise<void>
): Promise<void> {
  const url = process.env.RABBITMQ_URL ?? "amqp://breezy:breezy@localhost:5672"

  async function connectAndConsume(): Promise<void> {
    const { conn, channel } = await connectWithRetry(url)

    await channel.assertQueue(DLQ, { durable: true })
    await channel.assertExchange(EXCHANGE, "topic", { durable: true })
    await channel.assertQueue(QUEUE, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "",
        "x-dead-letter-routing-key": DLQ,
      },
    })
    await channel.bindQueue(QUEUE, EXCHANGE, "#")

    channel.prefetch(10)

    await channel.consume(QUEUE, async (msg) => {
      if (!msg) return
      try {
        const payload = JSON.parse(msg.content.toString()) as unknown
        await handler(msg.fields.routingKey, payload)
        channel.ack(msg)
      } catch (err) {
        logger.error(
          { err, routingKey: msg.fields.routingKey },
          "Failed to process event - sending to DLQ"
        )
        channel.nack(msg, false, false)
      }
    })

    consuming = true
    logger.info("RabbitMQ consumer started")

    conn.on("close", async () => {
      consuming = false
      logger.warn("RabbitMQ connection closed, reconnecting")
      await connectAndConsume()
    })

    conn.on("error", (err) => {
      logger.error({ err }, "RabbitMQ connection error")
    })
  }

  await connectAndConsume()
}

export function assertRabbitMQReady(): void {
  if (!consuming) throw new Error("RabbitMQ consumer not started")
}
