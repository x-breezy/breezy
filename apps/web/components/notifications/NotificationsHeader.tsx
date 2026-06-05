"use client"

import { useRouter } from "next/navigation"
import { IconChevronLeft } from "@tabler/icons-react"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"

export function NotificationsHeader() {
  const router = useRouter()

  return (
    <PageHeader>
      <PageHeaderContent
        left={
          <div className='flex items-center gap-2'>
            <button aria-label='Back' onClick={() => router.back()} className='text-foreground'>
              <IconChevronLeft size={22} strokeWidth={2} />
            </button>
            <h1 className='text-lg font-bold'>Notifications</h1>
          </div>
        }
      />
    </PageHeader>
  )
}
