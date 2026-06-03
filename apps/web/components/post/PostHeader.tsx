"use client"

import { useRouter } from "next/navigation"

export function PostHeader({ onPost }: { onPost: () => void }) {
  const router = useRouter()

  return (
    <header className='flex h-15 items-center justify-between border-b px-4'>
      <button onClick={() => router.back()} className='text-base font-medium text-foreground'>
        Annuler
      </button>
      <button
        onClick={onPost}
        className='rounded-full bg-[var(--brezzy-bg)] px-4 py-1.5 text-sm font-medium text-white'
      >
        Poster
      </button>
    </header>
  )
}
