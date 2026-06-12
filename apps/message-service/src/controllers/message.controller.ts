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

  // POST /conversations  { recipientId, recipientIds, name }
  getOrCreateConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { recipientId, recipientIds, name } = req.body
      
      let ids: string[] = []
      if (recipientIds && Array.isArray(recipientIds)) {
        ids = recipientIds
      } else if (recipientId) {
        ids = [recipientId]
      }

      if (ids.length === 0) {
        res.status(400).json({ success: false, message: "Recipient(s) required" })
        return
      }

      // Filter out current user if they accidentally included themselves
      const filteredIds = ids.filter(id => id !== req.user!.id)
      if (filteredIds.length === 0) {
        res.status(400).json({ success: false, message: "Cannot message yourself" })
        return
      }

      const allParticipants = [req.user!.id, ...filteredIds]
      // deduplicate
      const uniqueParticipants = Array.from(new Set(allParticipants))

      const conversation = await this.chatService.getOrCreateConversation(uniqueParticipants, name)
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
