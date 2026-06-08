"use client"

import { useState } from "react"
import { IconSettings } from "@tabler/icons-react"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"
import { SettingsDialog } from "@/components/settings"

export function ProfileHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <PageHeader>
        <PageHeaderContent
          left={<h1 className='text-lg font-bold'>My Profile</h1>}
          right={
            <button
              aria-label='Settings'
              className='flex size-8 items-center justify-center transition-transform duration-300 hover:rotate-90'
              onClick={() => setSettingsOpen(true)}
            >
              <IconSettings stroke={2} />
            </button>
          }
        />
      </PageHeader>
    </>
  )
}
