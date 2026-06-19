"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  IconChevronLeft,
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
  limit: number
  initialStatus?: string
  initialPage: number
  sanctioned: SanctionedList
}

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Resolved", value: "resolved" },
]

export function ModerationClient({
  initialReports,
  total,
  pendingCount,
  limit,
  initialStatus,
  initialPage,
  sanctioned,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  const activeStatus = searchParams.get("status") ?? initialStatus ?? ""
  const page = parseInt(searchParams.get("page") ?? String(initialPage)) || 1
  const totalPages = Math.ceil(total / limit)

  function changeFilter(status: string) {
    const params = new URLSearchParams()
    if (status) params.set("status", status)
    params.set("page", "1")
    router.push(`/moderation?${params.toString()}`)
  }

  function changePage(newPage: number) {
    const params = new URLSearchParams()
    if (activeStatus) params.set("status", activeStatus)
    params.set("page", String(newPage))
    router.push(`/moderation?${params.toString()}`)
  }

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

            {/* Filter tabs */}
            <div className='mb-4 flex gap-2 border-b'>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => changeFilter(opt.value)}
                  className={`pb-2 text-sm font-medium transition-colors ${
                    activeStatus === opt.value
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Error banner */}
            {error && (
              <div className='mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive'>
                <IconAlertTriangle size={16} />
                {error}
              </div>
            )}

            {/* Empty state */}
            {reports.length === 0 && (
              <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
                <IconCheck size={40} className='mb-3 opacity-40' />
                <p className='text-sm'>No reports found.</p>
              </div>
            )}

            {/* Report list */}
            <ul className='space-y-3'>
              {reports.map((report) => {
                const sanction = sanctions[report.reportedUserId] ?? {
                  isSuspended: report.reportedIsSuspended,
                  isBanned: report.reportedIsBanned,
                }
                return (
                  <li key={report.id} className='rounded-lg border p-4'>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='min-w-0 flex-1'>
                        {/* Status + date */}
                        <div className='mb-2 flex flex-wrap items-center gap-2'>
                          {report.status === "pending" ? (
                            <span className='inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'>
                              <IconClock size={12} />
                              Pending
                            </span>
                          ) : (
                            <span className='inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400'>
                              <IconCheck size={12} />
                              Resolved
                            </span>
                          )}
                          {sanction.isSuspended && !sanction.isBanned && (
                            <span className='inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'>
                              <IconUserOff size={12} />
                              Suspended
                            </span>
                          )}
                          {sanction.isBanned && (
                            <span className='inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400'>
                              <IconBan size={12} />
                              Banned
                            </span>
                          )}
                          <span className='text-xs text-muted-foreground'>
                            {new Date(report.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Reason */}
                        <p className='mb-2 text-sm'>{report.reason}</p>

                        {/* Reporter / Reported */}
                        <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
                          <span>
                            Reporter:{" "}
                            {report.reporterUsername ? (
                              <Link
                                href={`/profile/${report.reporterUsername}`}
                                className='inline-flex items-center gap-0.5 font-medium text-foreground hover:underline'
                              >
                                @{report.reporterUsername}
                                <IconExternalLink size={10} />
                              </Link>
                            ) : (
                              <span className='font-mono'>{report.reporterId.slice(0, 8)}…</span>
                            )}
                          </span>
                          <span>
                            Reported:{" "}
                            {report.reportedUsername ? (
                              <Link
                                href={`/profile/${report.reportedUsername}`}
                                className='inline-flex items-center gap-0.5 font-medium text-foreground hover:underline'
                              >
                                @{report.reportedUsername}
                                <IconExternalLink size={10} />
                              </Link>
                            ) : (
                              <span className='font-mono'>
                                {report.reportedUserId.slice(0, 8)}…
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className='flex shrink-0 flex-col items-end gap-2'>
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
                        {sanction.isSuspended && !sanction.isBanned && (
                          <button
                            onClick={() =>
                              runSanction(
                                report.id,
                                report.reportedUserId,
                                () => unsuspendUser(report.reportedUserId),
                                { isSuspended: false }
                              )
                            }
                            disabled={isPending && actionId === report.id}
                            className='inline-flex items-center gap-1 rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
                          >
                            <IconLockOpen size={12} />
                            Unsuspend
                          </button>
                        )}
                        {!sanction.isSuspended && !sanction.isBanned && (
                          <button
                            onClick={() =>
                              runSanction(
                                report.id,
                                report.reportedUserId,
                                () => suspendUser(report.reportedUserId),
                                { isSuspended: true }
                              )
                            }
                            disabled={isPending && actionId === report.id}
                            className='inline-flex items-center gap-1 rounded-md border border-orange-300 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-50 disabled:opacity-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-900/20'
                          >
                            <IconUserOff size={12} />
                            Suspend
                          </button>
                        )}
                        {isAdmin && sanction.isBanned && (
                          <button
                            onClick={() =>
                              runSanction(
                                report.id,
                                report.reportedUserId,
                                () => unbanUser(report.reportedUserId),
                                { isBanned: false }
                              )
                            }
                            disabled={isPending && actionId === report.id}
                            className='inline-flex items-center gap-1 rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-50 disabled:opacity-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
                          >
                            <IconLockOpen size={12} />
                            Unban
                          </button>
                        )}
                        {isAdmin && !sanction.isBanned && (
                          <button
                            onClick={() =>
                              runSanction(
                                report.id,
                                report.reportedUserId,
                                () => banUser(report.reportedUserId),
                                { isBanned: true }
                              )
                            }
                            disabled={isPending && actionId === report.id}
                            className='inline-flex items-center gap-1 rounded-md border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50'
                          >
                            <IconBan size={12} />
                            Ban
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='mt-6 flex items-center justify-center gap-3'>
                <button
                  onClick={() => changePage(page - 1)}
                  disabled={page <= 1}
                  className='rounded-md border px-3 py-1.5 text-sm disabled:opacity-40'
                >
                  Previous
                </button>
                <span className='text-sm text-muted-foreground'>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => changePage(page + 1)}
                  disabled={page >= totalPages}
                  className='rounded-md border px-3 py-1.5 text-sm disabled:opacity-40'
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
