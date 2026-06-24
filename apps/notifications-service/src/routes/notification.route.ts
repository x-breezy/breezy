import { Router } from "express"
import NotificationController from "../controllers/notification.controller"
import NotificationService from "../services/notification.service"
import { identity } from "../middlewares/identity.middleware"
import { readLimit, writeLimit, streamLimit } from "../middlewares/rate-limit.middleware"
import { validate } from "../middlewares/validate.middleware"
import {
  notificationIdParamSchema,
  listNotificationsQuerySchema,
  pushSubscribeBodySchema,
  pushUnsubscribeBodySchema,
} from "../schemas/notification.schema"

function createNotificationRouter(
  controller: NotificationController = new NotificationController(new NotificationService())
): Router {
  const router = Router({ mergeParams: true })

  router.get("/stream", identity, streamLimit, controller.stream)

  router.get(
    "/",
    identity,
    readLimit,
    validate(listNotificationsQuerySchema, "query"),
    controller.list
  )

  router.patch("/read-all", identity, writeLimit, controller.markAllRead)

  router.patch(
    "/:id/read",
    identity,
    writeLimit,
    validate(notificationIdParamSchema, "params"),
    controller.markRead
  )

  router.delete(
    "/:id",
    identity,
    writeLimit,
    validate(notificationIdParamSchema, "params"),
    controller.remove
  )

  router.get("/push/vapid-key", readLimit, controller.getVapidKey)

  router.post(
    "/push/subscribe",
    identity,
    writeLimit,
    validate(pushSubscribeBodySchema, "body"),
    controller.pushSubscribe
  )

  router.delete(
    "/push/subscribe",
    identity,
    writeLimit,
    validate(pushUnsubscribeBodySchema, "body"),
    controller.pushUnsubscribe
  )

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
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status (true = read, false = unread). Omit to return all.
 *     responses:
 *       200:
 *         description: Paginated list of notifications.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Notification' }
 *                 total: { type: integer, example: 100 }
 *                 page: { type: integer, example: 1 }
 *                 limit: { type: integer, example: 20 }
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
