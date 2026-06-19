import { Router } from "express"
import ReportController from "../controllers/report.controller"
import ReportService from "../services/report.service"
import { identity } from "../middlewares/identity.middleware"
import { requirePermission } from "../middlewares/roles.middleware"
import { validate } from "../middlewares/validate.middleware"
import { PERMISSIONS } from "../constants/permissions"
import { createReportSchema, reportIdParamSchema } from "../schemas/report.schema"
import { readLimit, writeLimit } from "../middlewares/rate-limit.middleware"

function createReportRouter(
  reportController: ReportController = new ReportController(new ReportService())
): Router {
  const router = Router({ mergeParams: true })

  router.post(
    "/",
    identity,
    writeLimit,
    requirePermission(PERMISSIONS.REPORT_CREATE),
    validate(createReportSchema),
    reportController.createReport
  )

  router.get(
    "/",
    identity,
    readLimit,
    requirePermission(PERMISSIONS.REPORT_RESOLVE),
    reportController.listReports
  )

  router.get(
    "/:id",
    identity,
    readLimit,
    requirePermission(PERMISSIONS.REPORT_RESOLVE),
    validate(reportIdParamSchema, "params"),
    reportController.getReport
  )

  router.patch(
    "/:id/resolve",
    identity,
    writeLimit,
    requirePermission(PERMISSIONS.REPORT_RESOLVE),
    validate(reportIdParamSchema, "params"),
    reportController.resolveReport
  )

  router.patch(
    "/:id/unresolve",
    identity,
    writeLimit,
    requirePermission(PERMISSIONS.REPORT_RESOLVE),
    validate(reportIdParamSchema, "params"),
    reportController.unresolveReport
  )

  return router
}

export { createReportRouter }

/**
 * @openapi
 * /api/auth/reports:
 *   get:
 *     summary: List reports (moderator/admin)
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, resolved]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of reports.
 *       403:
 *         description: Insufficient permissions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   post:
 *     summary: Create a report
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [targetId, reason]
 *             properties:
 *               targetId:
 *                 type: string
 *                 format: uuid
 *                 example: 550e8400-e29b-41d4-a716-446655440000
 *               reason:
 *                 type: string
 *                 example: Spam
 *     responses:
 *       201:
 *         description: Report created.
 *       403:
 *         description: Insufficient permissions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /api/auth/reports/{id}/resolve:
 *   patch:
 *     summary: Resolve a report
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Report resolved.
 *       403:
 *         description: Insufficient permissions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Report not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
