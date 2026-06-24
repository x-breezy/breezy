import { createLogger } from "@breezy/logger"
import { handleEmailVerification, handleForgotPassword, handle2FA } from "../handlers/auth.handler"
import { handleFollow } from "../handlers/social.handler"
import { handleLike, handleMention, handleReply } from "../handlers/content.handler"
import { handleMessageSent } from "../handlers/message.handler"

const logger = createLogger({ service: "notifications-service" })

const HANDLERS: Record<string, (payload: unknown) => Promise<void>> = {
  "auth.email_verification": handleEmailVerification,
  "auth.forgot_password": handleForgotPassword,
  "auth.2fa_code": handle2FA,
  "social.follow": handleFollow,
  "content.like": handleLike,
  "content.mention": handleMention,
  "content.reply": handleReply,
  "message.sent": handleMessageSent,
}

export async function handleEvent(routingKey: string, payload: unknown): Promise<void> {
  const handler = HANDLERS[routingKey]
  if (!handler) {
    logger.warn({ routingKey }, "No handler for routing key, skipping")
    return
  }
  await handler(payload)
  logger.info({ routingKey }, "Event processed")
}
