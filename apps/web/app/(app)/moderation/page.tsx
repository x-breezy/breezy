import { redirect } from "next/navigation"
import { getServerAuthHeader } from "@/lib/auth/session"
import { listReports } from "@/lib/actions/reports"
import {
  listSanctionedUsers,
  listAllUsers,
  type SanctionedList,
  type SanctionedUser,
} from "@/lib/actions/users"
import { ModerationClient } from "@/components/moderation/moderation-client"
import * as authService from "@/lib/services/auth-service"
import type { PaginatedReports, EnrichedReport } from "@/types/report"
import type { User } from "@/types/user"
import type { Metadata } from "next"
import { getProfilesByIdsUnfiltered } from "@/lib/services/profile-service"
import type { RawProfile } from "@/lib/api/profiles"

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
  let allUsers: SanctionedUser[] = []
  let allUsersTotal = 0
  let allUsersPage = 1
  let allUsersLimit = 100

  try {
    const [mainRes, pendingRes, sanctionedRes, allUsersRes] = await Promise.all([
      listReports(page, 20, status),
      listReports(1, 1, "pending"),
      listSanctionedUsers(1, 50),
      listAllUsers(1, 100),
    ])
    data = mainRes
    pendingCount = pendingRes.total
    sanctioned = sanctionedRes
    allUsers = allUsersRes.users
    allUsersTotal = allUsersRes.total
    allUsersPage = allUsersRes.page
    allUsersLimit = allUsersRes.limit
  } catch {
    // unauthorised or fetch error,  client will show empty state
  }

  // Resolve unique user IDs to usernames and profiles in parallel
  const uniqueIds = [...new Set(data.reports.flatMap((r) => [r.reporterId, r.reportedUserId]))]
  const reportedIds = [...new Set(data.reports.map((r) => r.reportedUserId))]
  const allUserIds = [...new Set(allUsers.map((u) => u.id))]
  const sanctionedIds = [...new Set(sanctioned.users.map((u) => u.id))]

  const usersMap = new Map<string, User>()
  const profilesMap = new Map<string, RawProfile>()

  await Promise.all([
    ...uniqueIds.map(async (id) => {
      const user = await safeGetUser(id, authHeader)
      if (user) usersMap.set(id, user)
    }),
    (async () => {
      try {
        const batchIds = [...new Set([...reportedIds, ...allUserIds, ...sanctionedIds])]
        if (batchIds.length === 0) return
        const res = await getProfilesByIdsUnfiltered(batchIds)
        for (const p of (res.data as { data: RawProfile[] }).data) {
          profilesMap.set(p.profileId, p)
        }
      } catch {
        // profiles unavailable,  avatars will be empty
      }
    })(),
  ])

  allUsers = allUsers.map((u) => ({ ...u, avatarUrl: profilesMap.get(u.id)?.avatarId ?? null }))
  sanctioned = {
    ...sanctioned,
    users: sanctioned.users.map((u) => ({
      ...u,
      avatarUrl: profilesMap.get(u.id)?.avatarId ?? null,
    })),
  }

  const enriched: EnrichedReport[] = data.reports.map((r) => ({
    ...r,
    reporterUsername: usersMap.get(r.reporterId)?.username ?? null,
    reportedUsername: usersMap.get(r.reportedUserId)?.username ?? null,
    reportedAvatarUrl: profilesMap.get(r.reportedUserId)?.avatarId ?? null,
    reportedIsBanned: usersMap.get(r.reportedUserId)?.isBanned ?? false,
    reportedRole: usersMap.get(r.reportedUserId)?.role ?? null,
  }))

  return (
    <ModerationClient
      initialReports={enriched}
      total={data.total}
      pendingCount={pendingCount}
      sanctioned={sanctioned}
      allUsers={allUsers}
      allUsersTotal={allUsersTotal}
      allUsersPage={allUsersPage}
      allUsersLimit={allUsersLimit}
    />
  )
}
