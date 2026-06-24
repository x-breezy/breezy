"use client"

import { useState } from "react"
import Link from "next/link"
import { IconChevronDown, IconChevronUp, IconExternalLink } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { SanctionBadge } from "./sanction-badge"
import { SanctionActions } from "./sanction-actions"
import { ReportItem } from "./report-item"
import type { EnrichedReport } from "@/types/report"
import type { SanctionState, RunSanction } from "./sanction-actions"

interface Props {
  userId: string
  username: string | null
  avatarUrl: string | null
  userReports: EnrichedReport[]
  sanction: SanctionState
  isAdmin: boolean
  isPending: boolean
  actionId: string | null
  runSanction: RunSanction
  runResolve: (id: string) => void
  runUnresolve: (id: string) => void
}

export function ReportedUserCard({
  userId,
  username,
  avatarUrl,
  userReports,
  sanction,
  isAdmin,
  isPending,
  actionId,
  runSanction,
  runResolve,
  runUnresolve,
}: Props) {
  const t = useTranslations("moderationPage")
  const [expanded, setExpanded] = useState(false)
  const pendingCount = userReports.filter((r) => r.status === "pending").length
  return (
    <li className='overflow-hidden rounded-xl py-1'>
      <div className='flex items-center gap-3 py-1'>
        <ProfileAvatar size='2xs' src={avatarUrl ?? undefined} />
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-2'>
            {username ? (
              <Link
                href={`/profile/${username}`}
                className='inline-flex items-center gap-1 font-semibold hover:underline'
              >
                @{username}
                <IconExternalLink size={12} />
              </Link>
            ) : (
              <span className='font-mono text-sm'>{userId.slice(0, 8)}…</span>
            )}
            <SanctionBadge {...sanction} />
          </div>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            {t("reportsCount", { count: userReports.length })}
            {pendingCount > 0 && (
              <span className='ml-2 font-semibold text-yellow-600 dark:text-yellow-400'>
                {t("pendingCountShort", { count: pendingCount })}
              </span>
            )}
          </p>
        </div>

        <div className='flex shrink-0 flex-wrap items-center gap-2'>
          <SanctionActions
            userId={userId}
            sanction={sanction}
            isAdmin={isAdmin}
            isPending={isPending}
            actionId={actionId}
            runSanction={runSanction}
          />
          <Button variant='outline' size='xs' onClick={() => setExpanded((v) => !v)}>
            {expanded ? <IconChevronUp size={12} /> : <IconChevronDown size={12} />}
            {expanded ? t("hide") : t("tabsReports")}
          </Button>
        </div>
      </div>

      {expanded && (
        <ul className='divide-y border-t'>
          {userReports.map((report) => (
            <ReportItem
              key={report.id}
              report={report}
              isPending={isPending}
              actionId={actionId}
              runResolve={runResolve}
              runUnresolve={runUnresolve}
            />
          ))}
        </ul>
      )}
    </li>
  )
}
