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
  /** Derived: number of users still sanctioned (suspended or banned) */
  sanctionedCount: number

  initReports: (reports: EnrichedReport[]) => void
  initSanctioned: (users: SanctionedUser[]) => void

  setSanction: (userId: string, patch: Partial<UserSanctionState>) => void
  resolveReport: (reportId: string) => void
  unresolveReport: (reportId: string) => void
}

export const useModerationStore = create<ModerationState>((set) => ({
  sanctions: {},
  reports: [],
  sanctionedUsers: [],
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
