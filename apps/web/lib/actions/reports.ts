"use server"

import { authenticatedFetch } from "@/lib/auth/authenticated-fetch"
import type { PaginatedReports } from "@/types/report"

export async function reportProfile(reportedUserId: string, reason: string): Promise<void> {
  const res = await authenticatedFetch("/api/reports/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportedUserId, reason }),
  })

  if (!res.ok) throw new Error(`Failed to submit report: ${res.status}`)
}

export async function listReports(
  page = 1,
  limit = 20,
  status?: string
): Promise<PaginatedReports> {
  const res = await authenticatedFetch(
    `/api/reports/?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`
  )
  if (!res.ok) throw new Error(`Failed to fetch reports: ${res.status}`)
  const body = await res.json()
  return (body as { data: PaginatedReports }).data
}

export async function resolveReport(id: string): Promise<void> {
  const res = await authenticatedFetch(`/api/reports/${id}/resolve`, { method: "PATCH" })
  if (!res.ok) throw new Error(`Failed to resolve report: ${res.status}`)
}

export async function unresolveReport(id: string): Promise<void> {
  const res = await authenticatedFetch(`/api/reports/${id}/unresolve`, { method: "PATCH" })
  if (!res.ok) throw new Error(`Failed to unresolve report: ${res.status}`)
}
