import amqplib from "amqplib"
import { createLogger } from "@breezy/logger"

const logger = createLogger({ service: "notifications-service" })

const EXCHANGE = "breezy.events"
const QUEUE = "notifications.queue"
const DLQ = "notifications.dlq"

export async function startConsuming(
  handler: (routingKey: string, payload: unknown) => Promise<void>
): Promise<void> {
  const url = process.env.RABBITMQ_URL ?? "amqp://breezy:breezy@localhost:5672"
  const conn = await amqplib.connect(url)
  const channel = await conn.createChannel()

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

  logger.info("RabbitMQ consumer started")
}
