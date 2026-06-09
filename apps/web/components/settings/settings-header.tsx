"use client"

import { IconX } from "@tabler/icons-react"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"

interface SettingsHeaderProps {
  onClose: () => void
}

export function SettingsHeader({ onClose }: SettingsHeaderProps) {
  return (
    <PageHeader className='bg-background'>
      <PageHeaderContent
        left={
          <button
            aria-label='Close settings'
            className='flex size-8 items-center justify-center text-foreground transition hover:opacity-70'
            onClick={onClose}
          >
            <IconX stroke={2} />
          </button>
        }
        center={<h1 className='text-lg font-bold'>Settings</h1>}
        right={<div className='size-8'></div>}
      />
    </PageHeader>
  )
}
