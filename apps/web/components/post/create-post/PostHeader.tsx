"use client"

import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"

export function PostHeader({
  onPost,
  onClose,
  posting = false,
}: {
  onPost: () => void | Promise<void>
  onClose?: () => void
  posting?: boolean
}) {
  const router = useRouter()
  const t = useTranslations("composePost")

  return (
    <header className='flex h-15 items-center justify-between border-b px-4'>
      <Button variant='ghost' size='icon-lg' onClick={onClose ?? (() => router.back())}>
        <IconArrowLeft className='size-5' />
      </Button>
      <Button className='font-semibold' onClick={onPost} disabled={posting}>
        {posting ? t("posting") : t("postBtn")}
      </Button>
    </header>
  )
}
