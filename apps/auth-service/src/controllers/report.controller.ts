import type { Request, Response, NextFunction } from "express"
import ReportService from "../services/report.service"
import type { CreateReportDTO } from "../schemas/report.schema"

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
      res.status(201).json({ success: true, message: "Report submitted successfully", data: report })
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
}

export default ReportController
