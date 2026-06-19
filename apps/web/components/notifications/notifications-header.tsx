"use client"

import { IconChevronLeft } from "@tabler/icons-react"
import { PageHeader, PageHeaderContent } from "../layout/page-header"
import { useTranslations } from "next-intl"
import Link from "next/link"

export function NotificationsHeader() {
  const t = useTranslations("notifications")
  return (
    <PageHeader>
      <PageHeaderContent
        left={
          <Link href='/' className='flex items-center gap-2'>
            <IconChevronLeft size={22} strokeWidth={2} />
            <h1 className='text-lg font-bold'>{t("title")}</h1>
          </Link>
        }
      />
    </PageHeader>
  )
}
