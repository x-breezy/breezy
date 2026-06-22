import { Router } from "express"
import ChatController from "../controllers/message.controller"
import { identity } from "../middlewares/identity.middleware"
import { validate } from "../middlewares/validate.middleware"
import {
  createConversationSchema,
  sendMessageSchema,
  renameConversationSchema,
  addMembersSchema,
} from "../schemas/message.schema"

export function createChatRouter(
  controller: ChatController = new ChatController()
) {
  const router = Router({ mergeParams: true })

  router.get("/", identity, controller.getConversations)
  router.post("/", identity, validate(createConversationSchema), controller.getOrCreateConversation)
  router.get("/:conversationId/messages", identity, controller.getMessages)
  router.post(
    "/:conversationId/messages",
    identity,
    validate(sendMessageSchema),
    controller.sendMessage
  )
  router.post(
    "/:conversationId/members",
    identity,
    validate(addMembersSchema),
    controller.addMembers
  )
  router.patch("/:conversationId/read", identity, controller.markAsRead)
  router.patch(
    "/:conversationId/name",
    identity,
    validate(renameConversationSchema),
    controller.renameConversation
  )
  router.delete("/:conversationId", identity, controller.deleteConversation)
  router.delete("/messages/:messageId", identity, controller.deleteMessage)

  return router
}
