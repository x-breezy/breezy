import { Router } from "express"
import ChatController from "../controllers/message.controller"
import ChatService from "../services/message.service"
import { identity } from "../middlewares/identity.middleware"
import { validate } from "../middlewares/validate.middleware"
import { createConversationSchema, sendMessageSchema } from "../schemas/message.schema"

export function createChatRouter(
  controller: ChatController = new ChatController(new ChatService())
) {
  const router = Router({ mergeParams: true })

  router.get("/", identity, controller.getConversations)
  router.post("/", identity, validate(createConversationSchema), controller.getOrCreateConversation)
  router.get("/:conversationId/messages", identity, controller.getMessages)
  router.post("/:conversationId/messages", identity, validate(sendMessageSchema), controller.sendMessage)
  router.patch("/:conversationId/read", identity, controller.markAsRead)
  router.delete("/messages/:messageId", identity, controller.deleteMessage)

  return router
}
