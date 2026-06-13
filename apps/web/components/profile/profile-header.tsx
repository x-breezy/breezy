"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconSettings, IconChevronLeft } from "@tabler/icons-react"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"
import { SettingsDialog } from "@/components/settings"

interface ProfileHeaderProps {
  title?: string
  isOwn?: boolean
}

export function ProfileHeader({ title = "My Profile", isOwn = true }: ProfileHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <PageHeader>
        <PageHeaderContent
          left={
            !isOwn ? (
              <button className='flex items-center gap-2' onClick={() => router.back()}>
                <IconChevronLeft size={22} strokeWidth={2} />
                <h1 className='text-lg font-bold'>{title}</h1>
              </button>
            ) : (
              <h1 className='text-lg font-bold'>{title}</h1>
            )
          }
          right={
            isOwn ? (
              <button
                aria-label='Settings'
                className='flex size-8 items-center justify-center transition-transform duration-300 hover:rotate-90'
                onClick={() => setSettingsOpen(true)}
              >
                <IconSettings stroke={2} />
              </button>
            ) : null
          }
        />
      </PageHeader>
    </>
  )
}
