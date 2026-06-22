import type { Request, Response, NextFunction } from "express"
import ReportService from "../services/report.service"
import type { CreateReportDTO } from "../schemas/report.schema"
import type { ReportStatus } from "../models/report.model"

class ReportController {
  private reportService: ReportService

  constructor(reportService: ReportService) {
    this.reportService = reportService
  }

  createReport = async (
    req: Request<Record<string, never>, unknown, CreateReportDTO>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const report = await this.reportService.createReport(req.user!.id, req.body)
      res
        .status(201)
        .json({ success: true, message: "Report submitted successfully", data: report })
    } catch (error) {
      next(error)
    }
  }

  listReports = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1)
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20))
      const statusParam = req.query.status as string | undefined
      const status: ReportStatus | undefined =
        statusParam === "pending" || statusParam === "resolved" ? statusParam : undefined
      const result = await this.reportService.listReports(page, limit, status)
      res.status(200).json({ success: true, data: result })
    } catch (error) {
      next(error)
    }
  }

  getReport = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const report = await this.reportService.getReport(req.params.id)
      if (!report) {
        res.status(404).json({ success: false, message: "Report not found" })
        return
      }
      res.status(200).json({ success: true, data: report })
    } catch (error) {
      next(error)
    }
  }

  resolveReport = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.reportService.resolveReport(req.params.id, req.user!.id)
      res.status(200).json({ success: true, message: "Report resolved successfully" })
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === "REPORT_NOT_FOUND") {
        res.status(404).json({ success: false, message: "Report not found" })
        return
      }
      if (code === "REPORT_ALREADY_RESOLVED") {
        res.status(409).json({ success: false, message: "Report already resolved" })
        return
      }
      next(error)
    }
  }

  unresolveReport = async (
    req: Request<{ id: string }>,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await this.reportService.unresolveReport(req.params.id)
      res.status(200).json({ success: true, message: "Report reopened successfully" })
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === "REPORT_NOT_FOUND") {
        res.status(404).json({ success: false, message: "Report not found" })
        return
      }
      if (code === "REPORT_ALREADY_PENDING") {
        res.status(409).json({ success: false, message: "Report already pending" })
        return
      }
      next(error)
    }
  }
}

export default ReportController
