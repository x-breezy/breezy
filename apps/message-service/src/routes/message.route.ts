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

export function createChatRouter(controller: ChatController = new ChatController()) {
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

/**
 * @openapi
 * tags:
 *   - name: Messages
 *     description: Private conversations and messaging
 *
 * /api/conversations:
 *   get:
 *     summary: List my conversations
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: List of conversations with unread counts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Conversation' } }
 *   post:
 *     summary: Get or create a conversation
 *     tags: [Messages]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateConversationInput'
 *     responses:
 *       200:
 *         description: Existing or new conversation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Conversation' }
 *
 * /api/conversations/{conversationId}/messages:
 *   get:
 *     summary: List messages in a conversation
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated messages.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: array, items: { $ref: '#/components/schemas/Message' } }
 *                 total: { type: integer }
 *                 page: { type: integer }
 *                 limit: { type: integer }
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendMessageInput'
 *     responses:
 *       201:
 *         description: Message sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Message' }
 *
 * /api/conversations/{conversationId}/read:
 *   patch:
 *     summary: Mark all messages in a conversation as read
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Messages marked as read.
 *
 * /api/conversations/{conversationId}/members:
 *   post:
 *     summary: Add members to a group conversation
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddMembersInput'
 *     responses:
 *       200:
 *         description: Members added.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Conversation' }
 *
 * /api/conversations/{conversationId}/name:
 *   patch:
 *     summary: Rename a group conversation
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RenameConversationInput'
 *     responses:
 *       200:
 *         description: Conversation renamed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/Conversation' }
 *
 * /api/conversations/{conversationId}:
 *   delete:
 *     summary: Delete/leave a conversation
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Conversation deleted/left.
 *
 * /api/messages/{messageId}:
 *   delete:
 *     summary: Delete a message sent by the current user
 *     tags: [Messages]
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Message deleted.
 *       404:
 *         description: Message not found.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
