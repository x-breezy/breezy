"use client"

import { IconChevronLeft } from "@tabler/icons-react"
import { PageHeader, PageHeaderContent } from "../layout/page-header"
import Link from "next/link"

export function NotificationsHeader() {
  return (
    <PageHeader>
      <PageHeaderContent
        left={
          <Link href='/' className='flex items-center gap-2'>
            <IconChevronLeft size={22} strokeWidth={2} />
            <h1 className='text-lg font-bold'>Notifications</h1>
          </Link>
        }
      />
    </PageHeader>
  )
}
