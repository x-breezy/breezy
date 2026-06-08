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
