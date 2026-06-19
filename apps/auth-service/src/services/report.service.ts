import { Report, type ReportAttributes, type ReportStatus } from "../models/report.model"
import type { CreateReportDTO } from "../schemas/report.schema"

export interface PaginatedReports {
  reports: ReportAttributes[]
  total: number
  page: number
  limit: number
}

class ReportService {
  async createReport(reporterId: string, dto: CreateReportDTO): Promise<ReportAttributes> {
    const report = await Report.create({
      reporterId,
      reportedUserId: dto.reportedUserId,
      reason: dto.reason,
    })
    return report.toJSON() as ReportAttributes
  }

  async listReports(
    page: number = 1,
    limit: number = 20,
    status?: ReportStatus
  ): Promise<PaginatedReports> {
    const where = status ? { status } : {}
    const offset = (page - 1) * limit
    const { count, rows } = await Report.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    })
    return { reports: rows.map((r) => r.toJSON() as ReportAttributes), total: count, page, limit }
  }

  async getReport(id: string): Promise<ReportAttributes | null> {
    const report = await Report.findByPk(id)
    return report ? (report.toJSON() as ReportAttributes) : null
  }

  async resolveReport(id: string, resolvedById: string): Promise<void> {
    const report = await Report.findByPk(id)
    if (!report) throw Object.assign(new Error("Report not found"), { code: "REPORT_NOT_FOUND" })
    if (report.status === "resolved") {
      throw Object.assign(new Error("Report already resolved"), { code: "REPORT_ALREADY_RESOLVED" })
    }
    await report.update({ status: "resolved", resolvedById })
  }

  async unresolveReport(id: string): Promise<void> {
    const report = await Report.findByPk(id)
    if (!report) throw Object.assign(new Error("Report not found"), { code: "REPORT_NOT_FOUND" })
    if (report.status === "pending") {
      throw Object.assign(new Error("Report already pending"), { code: "REPORT_ALREADY_PENDING" })
    }
    await report.update({ status: "pending", resolvedById: null })
  }
}

export default ReportService
