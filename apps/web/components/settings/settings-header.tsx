"use client"

import { IconX } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"

interface SettingsHeaderProps {
  onClose: () => void
}

export function SettingsHeader({ onClose }: SettingsHeaderProps) {
  const t = useTranslations("settings")
  return (
    <PageHeader className='w-full bg-background'>
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
        center={<h1 className='text-lg font-bold'>{t("title")}</h1>}
        right={<div className='size-8'></div>}
      />
    </PageHeader>
  )
}
