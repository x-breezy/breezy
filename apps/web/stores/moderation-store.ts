import { create } from "zustand"
import type { SanctionedUser } from "@/lib/actions/users"
import type { EnrichedReport } from "@/types/report"

interface UserSanctionState {
  isBanned: boolean
}

interface ModerationState {
  /** Per-userId sanction state — shared across report cards and sanctioned tab */
  sanctions: Record<string, UserSanctionState>
  reports: EnrichedReport[]
  sanctionedUsers: SanctionedUser[]
  allUsers: SanctionedUser[]
  allUsersPage: number
  allUsersLimit: number
  allUsersTotal: number
  /** Derived: number of users still sanctioned (suspended or banned) */
  sanctionedCount: number

  initReports: (reports: EnrichedReport[]) => void
  initSanctioned: (users: SanctionedUser[]) => void
  initAllUsers: (users: SanctionedUser[], total: number, page: number, limit: number) => void
  loadMoreUsers: (users: SanctionedUser[], total: number, page: number) => void
  addUser: (user: SanctionedUser) => void

  setSanction: (userId: string, patch: Partial<UserSanctionState>) => void
  resolveReport: (reportId: string) => void
  unresolveReport: (reportId: string) => void
}

export const useModerationStore = create<ModerationState>((set) => ({
  sanctions: {},
  reports: [],
  sanctionedUsers: [],
  allUsers: [],
  allUsersPage: 1,
  allUsersLimit: 100,
  allUsersTotal: 0,
  sanctionedCount: 0,

  initReports: (reports) => {
    const sanctions: Record<string, UserSanctionState> = {}
    for (const r of reports) {
      sanctions[r.reportedUserId] = {
        isBanned: r.reportedIsBanned,
      }
    }
    set((s) => ({ reports, sanctions: { ...s.sanctions, ...sanctions } }))
  },

  initAllUsers: (users, total, page, limit) => {
    const valid = users.filter((u) => !!u.id)
    set((s) => ({
      allUsers: valid,
      allUsersPage: page,
      allUsersLimit: limit,
      allUsersTotal: total,
      sanctions: {
        ...s.sanctions,
        ...Object.fromEntries(valid.map((u) => [u.id, { isBanned: u.isBanned }])),
      },
    }))
  },

  loadMoreUsers: (users, total, page) => {
    const valid = users.filter((u) => !!u.id)
    set((s) => ({
      allUsers: [...s.allUsers, ...valid.filter((u) => !s.allUsers.some((x) => x.id === u.id))],
      allUsersPage: page,
      allUsersTotal: total,
    }))
  },

  addUser: (user) =>
    set((s) => ({
      allUsers: s.allUsers.some((u) => u.id === user.id)
        ? s.allUsers
        : [user, ...s.allUsers],
      allUsersTotal: s.allUsersTotal + 1,
      sanctions: { ...s.sanctions, [user.id]: { isBanned: user.isBanned } },
    })),

  initSanctioned: (users) => {
    const sanctions: Record<string, UserSanctionState> = {}
    for (const u of users) {
      sanctions[u.id] = { isBanned: u.isBanned }
    }
    set((s) => ({
      sanctionedUsers: users,
      sanctionedCount: users.length,
      sanctions: { ...s.sanctions, ...sanctions },
    }))
  },

  setSanction: (userId, patch) =>
    set((s) => {
      const prev = s.sanctions[userId] ?? { isBanned: false }
      const next: UserSanctionState = {
        isBanned: patch.isBanned ?? prev.isBanned,
      }
      const isStillSanctioned = next.isBanned
      const wasSanctioned = prev.isBanned

      let sanctionedUsers = s.sanctionedUsers
      if (!isStillSanctioned) {
        // Remove from list when fully cleared
        sanctionedUsers = sanctionedUsers.filter((u) => u.id !== userId)
      } else {
        // Update in place
        sanctionedUsers = sanctionedUsers.map((u) =>
          u.id === userId ? { ...u, ...patch } : u
        )
      }
      const sanctionedCount = isStillSanctioned
        ? wasSanctioned
          ? s.sanctionedCount
          : s.sanctionedCount + 1
        : Math.max(0, s.sanctionedCount - 1)

      return {
        sanctions: { ...s.sanctions, [userId]: next },
        sanctionedUsers,
        sanctionedCount,
      }
    }),

  resolveReport: (reportId) =>
    set((s) => ({
      reports: s.reports.map((r) =>
        r.id === reportId ? { ...r, status: "resolved" as const } : r
      ),
    })),

  unresolveReport: (reportId) =>
    set((s) => ({
      reports: s.reports.map((r) =>
        r.id === reportId ? { ...r, status: "pending" as const } : r
      ),
    })),
}))
