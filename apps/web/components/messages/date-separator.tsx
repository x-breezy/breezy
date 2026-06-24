"use client"

import React from "react"
import { useTranslations } from "next-intl"

export function DateSeparator({ dateStr }: { dateStr: string }) {
  const t = useTranslations("messages")

  const d = new Date(dateStr)
  const now = new Date()
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  let label: string
  if (sameDay(d, now)) {
    label = t("today")
  } else {
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    label = sameDay(d, yesterday)
      ? t("yesterday")
      : d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })
  }

  return (
    <div className='my-4 flex items-center gap-3'>
      <div className='h-px flex-1' />
      <span className='px-2 text-xs text-muted-foreground'>{label}</span>
      <div className='h-px flex-1' />
    </div>
  )
}
