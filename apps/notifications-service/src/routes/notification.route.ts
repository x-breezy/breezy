import { Router } from "express"
import NotificationController from "../controllers/notification.controller"
import NotificationService from "../services/notification.service"
import { identity } from "../middlewares/identity.middleware"
import { validate } from "../middlewares/validate.middleware"
import {
  notificationIdParamSchema,
  listNotificationsQuerySchema,
} from "../schemas/notification.schema"

function createNotificationRouter(
  controller: NotificationController = new NotificationController(new NotificationService())
): Router {
  const router = Router({ mergeParams: true })

  router.get("/stream", identity, controller.stream)

  router.get("/", identity, validate(listNotificationsQuerySchema, "query"), controller.list)

  router.patch("/read-all", identity, controller.markAllRead)

  router.patch(
    "/:id/read",
    identity,
    validate(notificationIdParamSchema, "params"),
    controller.markRead
  )

  router.delete("/:id", identity, validate(notificationIdParamSchema, "params"), controller.remove)

  return router
}

export { createNotificationRouter }

/**
 * @openapi
 * /api/notifications/stream:
 *   get:
 *     summary: SSE stream for real-time notifications
 *     description: Server-Sent Events stream. Keeps connection open and pushes new notifications as they arrive.
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: SSE stream open.
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *
 * /api/notifications:
 *   get:
 *     summary: List notifications
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Paginated list of notifications.
 *
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications marked as read.
 *
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read.
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted.
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
