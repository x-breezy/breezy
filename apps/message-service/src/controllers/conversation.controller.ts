import { NextFunction, Request, Response } from "express"
import ConversationService from "../services/conversation.service"

export class ConversationController {
  constructor(protected convService = new ConversationService()) {}

  // GET /conversations
  getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const conversations = await this.convService.getConversations(req.user!.id)
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

      const filteredIds = ids.filter((id) => id !== req.user!.id)
      if (filteredIds.length === 0) {
        res.status(400).json({ success: false, message: "Cannot message yourself" })
        return
      }

      const uniqueParticipants = Array.from(new Set([req.user!.id, ...filteredIds]))
      const conversation = await this.convService.getOrCreateConversation(uniqueParticipants, name)
      res.status(200).json({ success: true, data: conversation })
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
      const deleted = await this.convService.deleteConversation(
        req.params.conversationId,
        req.user!.id
      )
      if (!deleted) {
        res.status(404).json({ success: false, message: "Conversation not found" })
        return
      }
      res.status(204).send()
    } catch (err) {
      next(err)
    }
  }

  // PATCH /conversations/:conversationId/name
  renameConversation = async (
    req: Request<{ conversationId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const updated = await this.convService.renameConversation(
        req.params.conversationId,
        req.user!.id,
        req.body.name
      )
      if (!updated) {
        res.status(404).json({
          success: false,
          message: "Group conversation not found or you don't have access",
        })
        return
      }
      res.status(200).json({ success: true, data: updated })
    } catch (err) {
      next(err)
    }
  }

  // POST /conversations/:conversationId/members
  addMembers = async (
    req: Request<{ conversationId: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const updated = await this.convService.addMembers(
        req.params.conversationId,
        req.user!.id,
        req.body.memberIds
      )
      if (!updated) {
        res.status(404).json({
          success: false,
          message: "Group conversation not found or you don't have access",
        })
        return
      }
      res.status(200).json({ success: true, data: updated })
    } catch (err) {
      next(err)
    }
  }
}

export default ConversationController
