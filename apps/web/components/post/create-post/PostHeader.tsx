"use client"

import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

export function PostHeader({
  onPost,
  onClose,
  posting = false,
  disabled = false,
  label,
}: {
  onPost: () => void | Promise<void>
  onClose?: () => void
  posting?: boolean
  disabled?: boolean
  label?: string
}) {
  const router = useRouter()
  const t = useTranslations("composePost")

  return (
    <header className='flex h-15 items-center justify-between border-b px-4'>
      <Button variant='ghost' size='icon-lg' onClick={onClose ?? (() => router.back())}>
        <IconArrowLeft className='size-5' />
      </Button>
      <Button className='font-semibold' onClick={onPost} disabled={posting || disabled}>
        {posting ? t("posting") : (label ?? t("postBtn"))}
      </Button>
    </header>
  )
}
