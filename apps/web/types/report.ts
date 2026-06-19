export type ReportStatus = "pending" | "resolved"

export interface Report {
  id: string
  reporterId: string
  reportedUserId: string
  reason: string
  status: ReportStatus
  resolvedById: string | null
  createdAt: string
  updatedAt: string
}

export interface EnrichedReport extends Report {
  reporterUsername: string | null
  reportedUsername: string | null
  reportedIsSuspended: boolean
  reportedIsBanned: boolean
  reportedRole: string | null
}

export interface PaginatedReports {
  reports: Report[]
  total: number
  page: number
  limit: number
}
