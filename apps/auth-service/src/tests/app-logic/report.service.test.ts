import ReportService from "../../services/report.service"
import { Report } from "../../models/report.model"

jest.mock("../../models/report.model", () => ({
  Report: {
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}))

const mockedReport = Report as jest.Mocked<typeof Report>

let service: ReportService

beforeEach(() => {
  jest.clearAllMocks()
  service = new ReportService()
})

const MOCK_REPORT = {
  id: "report-1",
  reporterId: "user-1",
  reportedUserId: "user-2",
  reason: "Spam",
  status: "pending",
  resolvedById: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  toJSON: function () {
    return {
      id: this.id,
      reporterId: this.reporterId,
      reportedUserId: this.reportedUserId,
      reason: this.reason,
      status: this.status,
      resolvedById: this.resolvedById,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  },
}

describe("createReport", () => {
  it("creates a report and returns it", async () => {
    ;(mockedReport.create as jest.Mock).mockResolvedValue(MOCK_REPORT)

    const result = await service.createReport("user-1", {
      reportedUserId: "user-2",
      reason: "Spam",
    })

    expect(mockedReport.create).toHaveBeenCalledWith({
      reporterId: "user-1",
      reportedUserId: "user-2",
      reason: "Spam",
    })
    expect(result).toMatchObject({
      id: "report-1",
      reporterId: "user-1",
      reportedUserId: "user-2",
      reason: "Spam",
      status: "pending",
    })
  })
})

describe("resolveReport", () => {
  it("resolves a pending report", async () => {
    const updateMock = jest.fn().mockResolvedValue(undefined)
    ;(mockedReport.findByPk as jest.Mock).mockResolvedValue({
      ...MOCK_REPORT,
      update: updateMock,
    })

    await service.resolveReport("report-1", "admin-1")

    expect(mockedReport.findByPk).toHaveBeenCalledWith("report-1")
    expect(updateMock).toHaveBeenCalledWith({
      status: "resolved",
      resolvedById: "admin-1",
    })
  })

  it("throws REPORT_NOT_FOUND when report does not exist", async () => {
    ;(mockedReport.findByPk as jest.Mock).mockResolvedValue(null)

    await expect(service.resolveReport("missing", "admin-1")).rejects.toMatchObject({
      code: "REPORT_NOT_FOUND",
    })
  })

  it("throws REPORT_ALREADY_RESOLVED when already resolved", async () => {
    const updateMock = jest.fn()
    ;(mockedReport.findByPk as jest.Mock).mockResolvedValue({
      ...MOCK_REPORT,
      status: "resolved",
      update: updateMock,
    })

    await expect(service.resolveReport("report-1", "admin-1")).rejects.toMatchObject({
      code: "REPORT_ALREADY_RESOLVED",
    })
    expect(updateMock).not.toHaveBeenCalled()
  })
})
