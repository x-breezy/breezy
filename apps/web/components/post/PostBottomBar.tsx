"use client"

import { useRef } from "react"
import { IconPhoto } from "@tabler/icons-react"
import { Button } from "@breezy/ui/components/button"

export function PostBottomBar() {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className='flex items-center gap-5 border-t px-2 py-2'>
      <Button
        variant='ghost'
        size='icon-lg'
        aria-label='Add photo'
        onClick={() => inputRef.current?.click()}
      >
        <IconPhoto className='size-5 text-muted-foreground' strokeWidth={2} />
      </Button>
      <input ref={inputRef} type='file' accept='image/*' className='hidden' />
    </div>
  )
}
