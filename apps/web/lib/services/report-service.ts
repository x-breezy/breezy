import serverClient from "@/lib/api/server-client"

export function getReports(
  authHeader: Record<string, string>,
  params?: { status?: string; page?: number; limit?: number }
) {
  return serverClient.get("/api/reports/", { headers: authHeader, params })
}

export function getReport(id: string, authHeader: Record<string, string>) {
  return serverClient.get(`/api/reports/${id}`, { headers: authHeader })
}

export function resolveReport(id: string, authHeader: Record<string, string>) {
  return serverClient.patch(`/api/reports/${id}/resolve`, null, { headers: authHeader })
}

export function unresolveReport(id: string, authHeader: Record<string, string>) {
  return serverClient.patch(`/api/reports/${id}/unresolve`, null, { headers: authHeader })
}

export function createReport(
  reportedUserId: string,
  reason: string,
  authHeader: Record<string, string>
) {
  return serverClient.post("/api/reports/", { reportedUserId, reason }, { headers: authHeader })
}
