"use client"

import Link from "next/link"
import { IconClock, IconCheck, IconExternalLink } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import type { EnrichedReport } from "@/types/report"

interface Props {
  report: EnrichedReport
  isPending: boolean
  actionId: string | null
  runResolve: (id: string) => void
  runUnresolve: (id: string) => void
}

export function ReportItem({ report, isPending, actionId, runResolve, runUnresolve }: Props) {
  const loading = isPending && actionId === report.id

  return (
    <li className='flex items-start justify-between gap-4 px-4 py-3'>
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
          <Button size='xs' onClick={() => runResolve(report.id)} disabled={loading}>
            {loading ? "…" : "Resolve"}
          </Button>
        ) : (
          <Button size='xs' variant='outline' onClick={() => runUnresolve(report.id)} disabled={loading}>
            {loading ? "…" : "Unresolve"}
          </Button>
        )}
      </div>
    </li>
  )
}
