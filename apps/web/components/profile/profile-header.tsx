"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { IconSettings, IconChevronLeft } from "@tabler/icons-react"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"
import { SettingsDialog } from "@/components/settings"
import { UserRole } from "@/lib/auth/role"
import { UsernameDisplay } from "@/components/shared/username-display"

interface ProfileHeaderProps {
  title?: string
  name?: string
  role?: UserRole
  isOwn?: boolean
}

export function ProfileHeader({
  title = "My Profile",
  name,
  role,
  isOwn = true,
}: ProfileHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const router = useRouter()

  const heading =
    !isOwn && name ? (
      <UsernameDisplay name={name} role={role} nameClassName='text-lg font-bold' />
    ) : (
      <h1 className='text-lg font-bold'>{title}</h1>
    )

  return (
    <>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <PageHeader>
        <PageHeaderContent
          left={
            !isOwn ? (
              <button className='flex items-center gap-2' onClick={() => router.back()}>
                <IconChevronLeft size={22} strokeWidth={2} />
                {heading}
              </button>
            ) : (
              heading
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
