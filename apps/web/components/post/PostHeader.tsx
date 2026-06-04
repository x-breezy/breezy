"use client"

import { Button } from "@breezy/ui/components/button"
import { IconArrowLeft } from "@tabler/icons-react"
import { useRouter } from "next/navigation"

export function PostHeader({ onPost, onClose }: { onPost: () => void; onClose?: () => void }) {
  const router = useRouter()

  return (
    <header className='flex h-15 items-center justify-between border-b px-4'>
      <Button variant='ghost' size='icon-lg' onClick={onClose ?? (() => router.back())}>
        <IconArrowLeft className='size-5' />
      </Button>
      <Button className='font-semibold' onClick={onPost}>
        Post
      </Button>
    </header>
  )
}
