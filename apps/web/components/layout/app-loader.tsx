"use client"

import { IconLoader2 } from "@tabler/icons-react"

export function AppLoader() {
  return (
    <div className='flex h-dvh w-full items-center justify-center'>
      <IconLoader2 className='h-8 w-8 animate-spin' />
    </div>
  )
}
