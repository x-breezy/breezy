import type { Request, Response, NextFunction } from "express"
import NotificationService from "../services/notification.service"
import { sseService } from "../services/sse.service"
import type {
  ListNotificationsQueryDTO,
  NotificationIdParamDTO,
} from "../schemas/notification.schema"

// sseService is injected here rather than into NotificationService to keep the service
// layer free of HTTP concerns — notifications push on create, stream registers on request

class NotificationController {
  private notificationService: NotificationService

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService
  }

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // req.query is replaced by the validate middleware with Zod-parsed output
      const { page, limit, read } = req.query as unknown as ListNotificationsQueryDTO
      const result = await this.notificationService.list(req.user!.id, {
        page: Math.max(1, Math.trunc(page)),
        limit: Math.min(100, Math.max(1, Math.trunc(limit))),
        read,
      })
      res.status(200).json({ success: true, ...result })
    } catch (error) {
      next(error)
    }
  }

  markRead = async (
    req: Request<NotificationIdParamDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const updated = await this.notificationService.markRead(req.params.id, req.user!.id)
      if (!updated) {
        res.status(404).json({ success: false, error: "Notification not found" })
        return
      }
      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  markAllRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.notificationService.markAllRead(req.user!.id)
      res.status(200).json({ success: true })
    } catch (error) {
      next(error)
    }
  }

  remove = async (
    req: Request<NotificationIdParamDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const deleted = await this.notificationService.remove(req.params.id, req.user!.id)
      if (!deleted) {
        res.status(404).json({ success: false, error: "Notification not found" })
        return
      }
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  stream = (req: Request, res: Response): void => {
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.flushHeaders()
    sseService.register(req.user!.id, res)
  }
}

export default NotificationController
