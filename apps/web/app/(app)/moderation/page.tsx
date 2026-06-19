import { redirect } from "next/navigation"
import { getServerAuthHeader } from "@/lib/auth/session"
import { getReports } from "@/lib/services/report-service"
import { listSanctionedUsers, type SanctionedList } from "@/lib/actions/users"
import { ModerationClient } from "@/components/moderation/moderation-client"
import * as authService from "@/lib/services/auth-service"
import type { PaginatedReports, EnrichedReport } from "@/types/report"
import type { User } from "@/types/user"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Moderation",
  description: "Review and resolve user reports.",
}

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>
}

async function safeGetUser(id: string, authHeader: Record<string, string>): Promise<User | null> {
  try {
    const res = await authService.getUserById(id, authHeader)
    return (res.data as { data: User }).data
  } catch {
    return null
  }
}

export default async function ModerationPage({ searchParams }: Props) {
  const { status, page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1)
  const authHeader = await getServerAuthHeader()

  // Guard: only moderators and admins may access this page
  try {
    const meRes = await authService.getMe(authHeader)
    const me = (meRes.data as { data: User }).data
    if (me.role !== "moderator" && me.role !== "admin") redirect("/")
  } catch {
    redirect("/")
  }

  let data: PaginatedReports = { reports: [], total: 0, page, limit: 20 }
  let pendingCount = 0
  let sanctioned: SanctionedList = { users: [], total: 0, page: 1, limit: 50 }

  try {
    const [mainRes, pendingRes, sanctionedRes] = await Promise.all([
      getReports(authHeader, { status, page, limit: 20 }),
      getReports(authHeader, { status: "pending", page: 1, limit: 1 }),
      listSanctionedUsers(1, 50),
    ])
    data = (mainRes.data as { data: PaginatedReports }).data
    pendingCount = (pendingRes.data as { data: PaginatedReports }).data.total
    sanctioned = sanctionedRes
  } catch {
    // unauthorised or fetch error — client will show empty state
  }

  // Resolve unique user IDs to usernames in parallel
  const uniqueIds = [...new Set(data.reports.flatMap((r) => [r.reporterId, r.reportedUserId]))]
  const usersMap = new Map<string, User>()
  await Promise.all(
    uniqueIds.map(async (id) => {
      const user = await safeGetUser(id, authHeader)
      if (user) usersMap.set(id, user)
    })
  )

  const enriched: EnrichedReport[] = data.reports.map((r) => ({
    ...r,
    reporterUsername: usersMap.get(r.reporterId)?.username ?? null,
    reportedUsername: usersMap.get(r.reportedUserId)?.username ?? null,
    reportedIsSuspended: usersMap.get(r.reportedUserId)?.isSuspended ?? false,
    reportedIsBanned: usersMap.get(r.reportedUserId)?.isBanned ?? false,
    reportedRole: usersMap.get(r.reportedUserId)?.role ?? null,
  }))

  return (
    <ModerationClient
      initialReports={enriched}
      total={data.total}
      pendingCount={pendingCount}
      sanctioned={sanctioned}
    />
  )
}
