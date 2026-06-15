"use client"

import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

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

  return (
    <header className='flex h-15 items-center justify-between border-b px-4'>
      <Button variant='ghost' size='icon-lg' onClick={onClose ?? (() => router.back())}>
        <IconArrowLeft className='size-5' />
      </Button>
      <Button className='font-semibold' onClick={onPost} disabled={posting}>
        {posting ? "Posting…" : "Post"}
      </Button>
    </header>
  )
}
