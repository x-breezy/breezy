"use client"

import { useRouter } from "next/navigation"
import { IconSettings } from "@tabler/icons-react"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"

export function ProfileHeader() {
  const router = useRouter()

  return (
    <PageHeader>
      <PageHeaderContent
        left={<h1 className='text-lg font-bold'>My Profile</h1>}
        right={
          <button
            aria-label='Settings'
            className='flex size-8 items-center justify-center transition-transform duration-300 hover:rotate-90'
            onClick={() => router.push("/settings")}
          >
            <IconSettings stroke={2} />
          </button>
        }
      />
    </PageHeader>
  )
}
