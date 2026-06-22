"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { IconChevronLeft } from "@tabler/icons-react"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  resolveReport as resolveReportAction,
  unresolveReport as unresolveReportAction,
} from "@/lib/actions/reports"
import { useUserStore } from "@/stores/user-store"
import { useModerationStore } from "@/stores/moderation-store"
import { UsersTab } from "./users-tab"
import type { EnrichedReport } from "@/types/report"
import type { SanctionedList, SanctionedUser } from "@/lib/actions/users"
import ReportsByUser from "./reports-by-user"

interface Props {
  initialReports: EnrichedReport[]
  total: number
  pendingCount: number
  sanctioned: SanctionedList
  allUsers: SanctionedUser[]
  allUsersTotal: number
  allUsersPage: number
  allUsersLimit: number
}

export function ModerationClient({
  initialReports,
  total,
  pendingCount,
  sanctioned,
  allUsers,
  allUsersTotal,
  allUsersPage,
  allUsersLimit,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = (searchParams.get("tab") ?? "reports") as "reports" | "users"

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
    initAllUsers(allUsers, allUsersTotal, allUsersPage, allUsersLimit)
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
        <Tabs value={activeTab} onValueChange={(v) => router.replace(`?tab=${v}`)}>
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
