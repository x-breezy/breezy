import { Report, type ReportAttributes } from "../models/report.model"
import type { CreateReportDTO } from "../schemas/report.schema"

class ReportService {
  async createReport(reporterId: string, dto: CreateReportDTO): Promise<ReportAttributes> {
    const report = await Report.create({
      reporterId,
      reportedUserId: dto.reportedUserId,
      reason: dto.reason,
    })
    return report.toJSON() as ReportAttributes
  }

  async resolveReport(id: string, resolvedById: string): Promise<void> {
    const report = await Report.findByPk(id)
    if (!report) throw Object.assign(new Error("Report not found"), { code: "REPORT_NOT_FOUND" })
    if (report.status === "resolved") {
      throw Object.assign(new Error("Report already resolved"), { code: "REPORT_ALREADY_RESOLVED" })
    }
    await report.update({ status: "resolved", resolvedById })
  }
}

export default ReportService
