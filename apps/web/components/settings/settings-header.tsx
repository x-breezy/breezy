"use client"

import { IconArrowLeft, IconX } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"

interface SettingsHeaderProps {
  onClose?: () => void
}

export function SettingsHeader({ onClose }: SettingsHeaderProps) {
  const router = useRouter()

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      router.back()
    }
  }

  return (
    <PageHeader className='bg-background'>
      <PageHeaderContent
        left={
          <button
            aria-label={onClose ? "Close settings" : "Go back"}
            className='flex size-8 items-center justify-center text-foreground transition hover:opacity-70'
            onClick={handleClose}
          >
            {onClose ? <IconX stroke={2} /> : <IconArrowLeft stroke={2} />}
          </button>
        }
        center={<h1 className='text-lg font-bold'>Settings</h1>}
      />
    </PageHeader>
  )
}
