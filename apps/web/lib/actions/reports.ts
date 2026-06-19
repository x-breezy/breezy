"use server"

import { getServerAuthHeader } from "@/lib/auth/session"
import * as reportService from "@/lib/services/report-service"
import type { PaginatedReports } from "@/types/report"

export async function reportProfile(reportedUserId: string, reason: string): Promise<void> {
  const authHeader = await getServerAuthHeader()
  await reportService.createReport(reportedUserId, reason, authHeader)
}

export async function listReports(
  page = 1,
  limit = 20,
  status?: string
): Promise<PaginatedReports> {
  const authHeader = await getServerAuthHeader()
  const res = await reportService.getReports(authHeader, { status, page, limit })
  return (res.data as { data: PaginatedReports }).data
}

export async function resolveReport(id: string): Promise<void> {
  const authHeader = await getServerAuthHeader()
  await reportService.resolveReport(id, authHeader)
}

export async function unresolveReport(id: string): Promise<void> {
  const authHeader = await getServerAuthHeader()
  await reportService.unresolveReport(id, authHeader)
}
