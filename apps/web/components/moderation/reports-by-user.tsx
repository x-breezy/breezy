import { IconAlertTriangle, IconCheck, IconClock, IconShield } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { ReportedUserCard } from "./reported-user-card"
import { EnrichedReport } from "@/types/report"
import { RunSanction, SanctionState } from "./sanction-actions"

interface ReportsByUserProps {
  reports: EnrichedReport[]
  sanctions: Record<string, SanctionState>
  isAdmin: boolean
  isPending: boolean
  actionId: string | null
  error: string | null
  pendingCount: number
  total: number
  runSanction: RunSanction
  runResolve: (reportId: string) => void
  runUnresolve: (reportId: string) => void
}

export default function ReportsByUser({
  reports,
  sanctions,
  isAdmin,
  isPending,
  actionId,
  error,
  pendingCount,
  total,
  runSanction,
  runResolve,
  runUnresolve,
}: ReportsByUserProps) {
  const t = useTranslations("moderationPage")
  const grouped = reports.reduce<
    Record<
      string,
      {
        userId: string
        username: string | null
        avatarUrl: string | null
        reports: EnrichedReport[]
      }
    >
  >((acc, r) => {
    if (!acc[r.reportedUserId]) {
      acc[r.reportedUserId] = {
        userId: r.reportedUserId,
        username: r.reportedUsername,
        avatarUrl: r.reportedAvatarUrl,
        reports: [],
      }
    }
    acc[r.reportedUserId]!.reports.push(r)
    return acc
  }, {})

  const groups = Object.values(grouped)

  return (
    <>
      <div className='mb-5 flex gap-3'>
        <div className='flex items-center gap-2 rounded-lg border bg-yellow-50 px-4 py-2 dark:bg-yellow-900/20'>
          <IconClock size={16} className='text-yellow-600 dark:text-yellow-400' />
          <span className='text-sm font-semibold text-yellow-800 dark:text-yellow-300'>
            {t("pendingCount", { count: pendingCount })}
          </span>
        </div>
        <div className='flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2'>
          <IconShield size={16} className='text-muted-foreground' />
          <span className='text-sm font-semibold text-muted-foreground'>
            {t("totalCount", { count: total })}
          </span>
        </div>
      </div>

      {error && (
        <div className='mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive'>
          <IconAlertTriangle size={16} />
          {error}
        </div>
      )}

      {groups.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
          <IconCheck size={40} className='mb-3 opacity-40' />
          <p className='text-sm'>{t("noReports")}</p>
        </div>
      )}

      <ul className='space-y-3'>
        {groups.map(({ userId, username, avatarUrl, reports: userReports }) => (
          <ReportedUserCard
            key={userId}
            userId={userId}
            username={username}
            avatarUrl={avatarUrl}
            userReports={userReports}
            sanction={sanctions[userId] ?? { isBanned: false }}
            isAdmin={isAdmin}
            isPending={isPending}
            actionId={actionId}
            runSanction={runSanction}
            runResolve={runResolve}
            runUnresolve={runUnresolve}
          />
        ))}
      </ul>
    </>
  )
}
