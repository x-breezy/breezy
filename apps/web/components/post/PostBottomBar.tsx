"use client"

import { IconPhoto } from "@tabler/icons-react"

export function PostBottomBar() {
  return (
    <div className='flex h-15 items-center gap-5 border-t px-4 py-3'>
      <label aria-label='Add photo' className='cursor-pointer text-[var(--brezzy-bg)]'>
        <IconPhoto size={30} strokeWidth={2} />
        <input type='file' accept='image/*' className='hidden' />
      </label>
    </div>
  )
}
