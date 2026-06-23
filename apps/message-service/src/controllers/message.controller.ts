import { NextFunction, Request, Response } from "express"
import { ConversationController } from "./conversation.controller"
import MessageService from "../services/message.service"
import ConversationService from "../services/conversation.service"

class ChatController extends ConversationController {
  constructor(
    private msgService = new MessageService(),
    convService = new ConversationService()
  ) {
    super(convService)
  }

  // GET /conversations/:conversationId/messages?page=1&limit=20
  getMessages = async (
    req: Request<{ conversationId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const result = await this.msgService.getMessages(req.params.conversationId, page, limit)
      res.status(200).json({ success: true, ...result })
    } catch (err) {
      next(err)
    }
  }

  // POST /conversations/:conversationId/messages  { content }
  sendMessage = async (
    req: Request<{ conversationId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const message = await this.msgService.sendMessage(
        req.params.conversationId,
        req.user!.id,
        req.body.content,
        req.body.replyTo
      )
      res.status(201).json({ success: true, data: message })
    } catch (err) {
      next(err)
    }
  }

  // PATCH /conversations/:conversationId/read
  markAsRead = async (
    req: Request<{ conversationId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.msgService.markAsRead(req.params.conversationId, req.user!.id)
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }

  // DELETE /messages/:messageId
  deleteMessage = async (
    req: Request<{ messageId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deleted = await this.msgService.deleteMessage(req.params.messageId, req.user!.id)
      if (!deleted) {
        res.status(404).json({ success: false, message: "Message not found" })
        return
      }
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}

export default ChatController
