"use client"

import { IconX } from "@tabler/icons-react"
import { useTranslations } from "next-intl"
import { PageHeader, PageHeaderContent } from "@/components/layout/page-header"
import type { Profile } from "@/types/profile"

interface ProfileEditHeaderProps {
  onClose: () => void
  profile: Profile
}

export function ProfileEditHeader({ onClose }: ProfileEditHeaderProps) {
  const t = useTranslations("profilePage")
  return (
    <PageHeader className='w-full bg-background'>
      <PageHeaderContent
        left={
          <button
            aria-label={t("closeEdit")}
            className='flex size-8 items-center justify-center text-foreground transition hover:opacity-70'
            onClick={onClose}
          >
            <IconX stroke={2} />
          </button>
        }
        center={<h1 className='text-lg font-bold'>{t("editProfile")}</h1>}
        right={<div className='size-8'></div>}
      />
    </PageHeader>
  )
}
