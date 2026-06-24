import amqplib from "amqplib"
import { createLogger } from "@breezy/logger"

const logger = createLogger({ service: "auth-service" })
const EXCHANGE = "breezy.events"

let channel: amqplib.Channel | null = null

export async function connectRabbitMQ(): Promise<void> {
  try {
    const url = process.env.RABBITMQ_URL ?? "amqp://breezy:breezy@localhost:5672"
    const conn = await amqplib.connect(url)
    channel = await conn.createChannel()
    await channel.assertExchange(EXCHANGE, "topic", { durable: true })
    conn.on("close", () => {
      channel = null
      logger.warn("RabbitMQ connection closed")
    })
    logger.info("Connected to RabbitMQ")
  } catch (err) {
    logger.warn({ err }, "Failed to connect to RabbitMQ, notifications disabled")
  }
}

export function assertRabbitMQReady(): void {
  if (!channel) throw new Error("RabbitMQ channel not initialized")
}

export async function publish(routingKey: string, payload: object): Promise<void> {
  if (!channel) return
  try {
    const content = Buffer.from(JSON.stringify(payload))
    channel.publish(EXCHANGE, routingKey, content, { persistent: true })
  } catch (err) {
    logger.warn({ err, routingKey }, "Failed to publish event")
  }
}
