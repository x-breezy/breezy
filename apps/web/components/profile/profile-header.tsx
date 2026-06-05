"use client"

import { IconSettings } from "@tabler/icons-react"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"

export function ProfileHeader() {
  return (
    <PageHeader>
      <PageHeaderContent
        left={<h1 className='text-lg font-bold'>My Profile</h1>}
        right={
          <button className='flex size-8 items-center justify-center transition-transform duration-300 hover:rotate-90'>
            <IconSettings stroke={2} />
          </button>
        }
      />
    </PageHeader>
  )
}
