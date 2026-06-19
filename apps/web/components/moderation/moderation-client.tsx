"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import {
  IconChevronLeft,
  IconChevronDown,
  IconChevronUp,
  IconCheck,
  IconClock,
  IconAlertTriangle,
  IconShield,
  IconUserOff,
  IconBan,
  IconExternalLink,
  IconLockOpen,
} from "@tabler/icons-react"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"
import {
  resolveReport as resolveReportAction,
  unresolveReport as unresolveReportAction,
} from "@/lib/actions/reports"
import { suspendUser, banUser, unsuspendUser, unbanUser } from "@/lib/actions/users"
import { useUserStore } from "@/stores/user-store"
import { useModerationStore } from "@/stores/moderation-store"
import { SanctionedTab } from "./sanctioned-tab"
import type { EnrichedReport } from "@/types/report"
import type { SanctionedList } from "@/lib/actions/users"

interface Props {
  initialReports: EnrichedReport[]
  total: number
  pendingCount: number
  sanctioned: SanctionedList
}

export function ModerationClient({ initialReports, total, pendingCount, sanctioned }: Props) {
  const isAdmin = useUserStore((s) => s.user?.role) === "admin"
  const [activeTab, setActiveTab] = useState<"reports" | "sanctioned">("reports")
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const initReports = useModerationStore((s) => s.initReports)
  const initSanctioned = useModerationStore((s) => s.initSanctioned)
  const setSanction = useModerationStore((s) => s.setSanction)
  const resolveReportStore = useModerationStore((s) => s.resolveReport)
  const unresolveReportStore = useModerationStore((s) => s.unresolveReport)
  const reports = useModerationStore((s) => s.reports)
  const sanctions = useModerationStore((s) => s.sanctions)
  const sanctionedCount = useModerationStore((s) => s.sanctionedCount)

  // Seed the store once on mount with SSR data
  useEffect(() => {
    initReports(initialReports)
    initSanctioned(sanctioned.users)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function runSanction(
    reportId: string,
    userId: string,
    fn: () => Promise<void>,
    patch: { isSuspended?: boolean; isBanned?: boolean }
  ) {
    setActionId(reportId)
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
        {/* Top-level tabs */}
        <div className='mb-5 flex gap-1 rounded-lg border p-1'>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              activeTab === "reports"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab("sanctioned")}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              activeTab === "sanctioned"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sanctioned ({sanctionedCount})
          </button>
        </div>

        {activeTab === "sanctioned" && <SanctionedTab />}

        {activeTab === "reports" && (
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
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Grouped-by-user reports view
// ---------------------------------------------------------------------------

interface UserSanctionState {
  isSuspended: boolean
  isBanned: boolean
}

interface ReportsByUserProps {
  reports: EnrichedReport[]
  sanctions: Record<string, UserSanctionState>
  isAdmin: boolean
  isPending: boolean
  actionId: string | null
  error: string | null
  pendingCount: number
  total: number
  runSanction: (
    id: string,
    userId: string,
    fn: () => Promise<void>,
    patch: { isSuspended?: boolean; isBanned?: boolean }
  ) => void
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
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)

  const grouped = reports.reduce<
    Record<string, { userId: string; username: string | null; reports: EnrichedReport[] }>
  >((acc, r) => {
    if (!acc[r.reportedUserId]) {
      acc[r.reportedUserId] = {
        userId: r.reportedUserId,
        username: r.reportedUsername,
        reports: [],
      }
    }
    acc[r.reportedUserId]!.reports.push(r)
    return acc
  }, {})

  const groups = Object.values(grouped)

  return (
    <>
      {/* Stats */}
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

      {/* Error banner */}
      {error && (
        <div className='mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive'>
          <IconAlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && (
        <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
          <IconCheck size={40} className='mb-3 opacity-40' />
          <p className='text-sm'>No reports found.</p>
        </div>
      )}

      {/* Grouped list */}
      <ul className='space-y-3'>
        {groups.map(({ userId, username, reports: userReports }) => {
          const sanction = sanctions[userId] ?? { isSuspended: false, isBanned: false }
          const pendingReports = userReports.filter((r) => r.status === "pending")
          const isExpanded = expandedUserId === userId

          return (
            <li key={userId} className='overflow-hidden rounded-lg border'>
              {/* User card header */}
              <div className='flex items-center justify-between gap-4 p-4'>
                <div className='flex min-w-0 flex-1 flex-col gap-1'>
                  <div className='flex flex-wrap items-center gap-2'>
                    {username ? (
                      <Link
                        href={`/profile/${username}`}
                        className='inline-flex items-center gap-1 font-semibold hover:underline'
                      >
                        @{username}
                        <IconExternalLink size={13} />
                      </Link>
                    ) : (
                      <span className='font-mono text-sm'>{userId.slice(0, 8)}…</span>
                    )}
                    {sanction.isSuspended && !sanction.isBanned && (
                      <span className='inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'>
                        <IconUserOff size={11} />
                        Suspended
                      </span>
                    )}
                    {sanction.isBanned && (
                      <span className='inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400'>
                        <IconBan size={11} />
                        Banned
                      </span>
                    )}
                  </div>
                  <div className='flex gap-3 text-xs text-muted-foreground'>
                    <span>
                      <span className='font-semibold text-foreground'>{userReports.length}</span>{" "}
                      report{userReports.length > 1 ? "s" : ""}
                    </span>
                    {pendingReports.length > 0 && (
                      <span className='font-semibold text-yellow-600 dark:text-yellow-400'>
                        {pendingReports.length} pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Sanction actions + expand toggle */}
                <div className='flex shrink-0 flex-wrap items-center gap-2'>
                  {sanction.isSuspended && !sanction.isBanned && (
                    <button
                      onClick={() =>
                        runSanction(userId, userId, () => unsuspendUser(userId), {
                          isSuspended: false,
                        })
                      }
                      disabled={isPending && actionId === userId}
                      className='inline-flex items-center gap-1 rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
                    >
                      <IconLockOpen size={12} />
                      {actionId === userId ? "…" : "Unsuspend"}
                    </button>
                  )}
                  {!sanction.isSuspended && !sanction.isBanned && (
                    <button
                      onClick={() =>
                        runSanction(userId, userId, () => suspendUser(userId), {
                          isSuspended: true,
                        })
                      }
                      disabled={isPending && actionId === userId}
                      className='inline-flex items-center gap-1 rounded-md border border-orange-300 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-50 disabled:opacity-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20'
                    >
                      <IconUserOff size={12} />
                      {actionId === userId ? "…" : "Suspend"}
                    </button>
                  )}
                  {isAdmin && sanction.isBanned && (
                    <button
                      onClick={() =>
                        runSanction(userId, userId, () => unbanUser(userId), { isBanned: false })
                      }
                      disabled={isPending && actionId === userId}
                      className='inline-flex items-center gap-1 rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
                    >
                      <IconLockOpen size={12} />
                      {actionId === userId ? "…" : "Unban"}
                    </button>
                  )}
                  {isAdmin && !sanction.isBanned && (
                    <button
                      onClick={() =>
                        runSanction(userId, userId, () => banUser(userId), { isBanned: true })
                      }
                      disabled={isPending && actionId === userId}
                      className='inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50'
                    >
                      <IconBan size={12} />
                      {actionId === userId ? "…" : "Ban"}
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedUserId(isExpanded ? null : userId)}
                    className='inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted'
                  >
                    {isExpanded ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
                    {isExpanded ? "Hide" : "Reports"}
                  </button>
                </div>
              </div>

              {/* Expanded: individual reports */}
              {isExpanded && (
                <ul className='divide-y border-t bg-muted/30'>
                  {userReports.map((report) => (
                    <li
                      key={report.id}
                      className='flex items-start justify-between gap-4 px-4 py-3'
                    >
                      <div className='min-w-0 flex-1'>
                        <div className='mb-1 flex flex-wrap items-center gap-2'>
                          {report.status === "pending" ? (
                            <span className='inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'>
                              <IconClock size={11} />
                              Pending
                            </span>
                          ) : (
                            <span className='inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                              <IconCheck size={11} />
                              Resolved
                            </span>
                          )}
                          <span className='text-xs text-muted-foreground'>
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className='mb-1 text-sm'>{report.reason}</p>
                        {report.reporterUsername && (
                          <p className='text-xs text-muted-foreground'>
                            By{" "}
                            <Link
                              href={`/profile/${report.reporterUsername}`}
                              className='inline-flex items-center gap-0.5 font-medium text-foreground hover:underline'
                            >
                              @{report.reporterUsername}
                              <IconExternalLink size={10} />
                            </Link>
                          </p>
                        )}
                      </div>
                      <div className='shrink-0'>
                        {report.status === "pending" ? (
                          <button
                            onClick={() => runResolve(report.id)}
                            disabled={isPending && actionId === report.id}
                            className='rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50'
                          >
                            {actionId === report.id ? "…" : "Resolve"}
                          </button>
                        ) : (
                          <button
                            onClick={() => runUnresolve(report.id)}
                            disabled={isPending && actionId === report.id}
                            className='rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50'
                          >
                            {actionId === report.id ? "…" : "Unresolve"}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
