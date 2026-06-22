"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import {
  IconChevronLeft,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconShield,
} from "@tabler/icons-react"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  resolveReport as resolveReportAction,
  unresolveReport as unresolveReportAction,
} from "@/lib/actions/reports"
import { useUserStore } from "@/stores/user-store"
import { useModerationStore } from "@/stores/moderation-store"
import { UsersTab } from "./users-tab"
import { ReportedUserCard } from "./reported-user-card"
import type { EnrichedReport } from "@/types/report"
import type { SanctionedList, SanctionedUser } from "@/lib/actions/users"
import type { RunSanction, SanctionState } from "./sanction-actions"

interface Props {
  initialReports: EnrichedReport[]
  total: number
  pendingCount: number
  sanctioned: SanctionedList
  allUsers: SanctionedUser[]
}

export function ModerationClient({
  initialReports,
  total,
  pendingCount,
  sanctioned,
  allUsers,
}: Props) {
  const isAdmin = useUserStore((s) => s.user?.role) === "admin"
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initReports = useModerationStore((s) => s.initReports)
  const initSanctioned = useModerationStore((s) => s.initSanctioned)
  const initAllUsers = useModerationStore((s) => s.initAllUsers)
  const setSanction = useModerationStore((s) => s.setSanction)
  const resolveReportStore = useModerationStore((s) => s.resolveReport)
  const unresolveReportStore = useModerationStore((s) => s.unresolveReport)
  const reports = useModerationStore((s) => s.reports)
  const sanctions = useModerationStore((s) => s.sanctions)

  useEffect(() => {
    initReports(initialReports)
    initSanctioned(sanctioned.users)
    initAllUsers(allUsers)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function runSanction(
    id: string,
    userId: string,
    fn: () => Promise<void>,
    patch: { isBanned?: boolean }
  ) {
    setActionId(id)
    setError(null)
    startTransition(async () => {
      try {
        await fn()
        setSanction(userId, patch)
      } catch {
        setError("Action failed. Please try again.")
      } finally {
        setActionId(null)
      }
    })
  }

  function runResolve(reportId: string) {
    setActionId(reportId)
    setError(null)
    startTransition(async () => {
      try {
        await resolveReportAction(reportId)
        resolveReportStore(reportId)
      } catch {
        setError("Action failed. Please try again.")
      } finally {
        setActionId(null)
      }
    })
  }

  function runUnresolve(reportId: string) {
    setActionId(reportId)
    setError(null)
    startTransition(async () => {
      try {
        await unresolveReportAction(reportId)
        unresolveReportStore(reportId)
      } catch {
        setError("Action failed. Please try again.")
      } finally {
        setActionId(null)
      }
    })
  }

  return (
    <div>
      <PageHeader>
        <PageHeaderContent
          left={
            <Link href='/' className='flex items-center gap-2'>
              <IconChevronLeft size={22} strokeWidth={2} />
              <h1 className='text-lg font-bold'>Moderation</h1>
            </Link>
          }
        />
      </PageHeader>

      <div className='container-center px-4 py-4'>
        <Tabs defaultValue='reports'>
          <TabsList className='mb-5 w-full'>
            <TabsTrigger value='reports' className='flex-1'>
              Reports
            </TabsTrigger>
            <TabsTrigger value='users' className='flex-1'>
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value='reports'>
            <ReportsByUser
              reports={reports}
              sanctions={sanctions}
              isAdmin={isAdmin}
              isPending={isPending}
              actionId={actionId}
              error={error}
              pendingCount={pendingCount}
              total={total}
              runSanction={runSanction}
              runResolve={runResolve}
              runUnresolve={runUnresolve}
            />
          </TabsContent>

          <TabsContent value='users'>
            <UsersTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ReportsByUser — groups reports by reported user
// ---------------------------------------------------------------------------

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

function ReportsByUser({
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
            {pendingCount} pending
          </span>
        </div>
        <div className='flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2'>
          <IconShield size={16} className='text-muted-foreground' />
          <span className='text-sm font-semibold text-muted-foreground'>{total} total</span>
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
          <p className='text-sm'>No reports found.</p>
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
