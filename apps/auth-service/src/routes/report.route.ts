import { Router } from "express"
import ReportController from "../controllers/report.controller"
import ReportService from "../services/report.service"
import { identity } from "../middlewares/identity.middleware"
import { requirePermission } from "../middlewares/roles.middleware"
import { validate } from "../middlewares/validate.middleware"
import { PERMISSIONS } from "../constants/permissions"
import { createReportSchema, reportIdParamSchema } from "../schemas/report.schema"

function createReportRouter(
  reportController: ReportController = new ReportController(new ReportService())
): Router {
  const router = Router({ mergeParams: true })

  router.post(
    "/",
    identity,
    requirePermission(PERMISSIONS.REPORT_CREATE),
    validate(createReportSchema),
    reportController.createReport
  )

  router.patch(
    "/:id/resolve",
    identity,
    requirePermission(PERMISSIONS.REPORT_RESOLVE),
    validate(reportIdParamSchema, "params"),
    reportController.resolveReport
  )

  return router
}

export { createReportRouter }
