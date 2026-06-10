import { NextFunction, Request, Response } from "express"
import ChatService from "../services/message.service"

class ChatController {
  constructor(private chatService = new ChatService()) {}

  // GET /conversations
  getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversations = await this.chatService.getConversations(req.user!.id)
      res.status(200).json({ success: true, data: conversations })
    } catch (err) {
      next(err)
    }
  }

  // POST /conversations  { recipientId }
  getOrCreateConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { recipientId } = req.body
      if (req.user!.id === recipientId) {
        res.status(400).json({ success: false, message: "Cannot message yourself" })
        return
      }
      const conversation = await this.chatService.getOrCreateConversation(req.user!.id, recipientId)
      res.status(200).json({ success: true, data: conversation })
    } catch (err) {
      next(err)
    }
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
      const result = await this.chatService.getMessages(req.params.conversationId, page, limit)
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
      const message = await this.chatService.sendMessage(
        req.params.conversationId,
        req.user!.id,
        req.body.content
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
      await this.chatService.markAsRead(req.params.conversationId, req.user!.id)
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
      const deleted = await this.chatService.deleteMessage(req.params.messageId, req.user!.id)
      if (!deleted) {
        res.status(404).json({ success: false, message: "Message not found" })
        return
      }
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }

  // DELETE /conversations/:conversationId
  deleteConversation = async (
    req: Request<{ conversationId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deleted = await this.chatService.deleteConversation(req.params.conversationId, req.user!.id)
      if (!deleted) {
        res.status(404).json({ success: false, message: "Conversation not found" })
        return
      }
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }
}

export default ChatController
