"use client"

import { IconSearch } from "@tabler/icons-react"

export function SearchHeader() {
  return (
    <header className='sticky top-0 z-10 bg-background/80 px-4 py-2.5 backdrop-blur-sm'>
      <div className='flex items-center gap-2.5 rounded-full bg-muted px-4 py-2.5'>
        <IconSearch size={18} strokeWidth={2} className='shrink-0 text-muted-foreground' />
        <input
          type='text'
          placeholder='Rechercher'
          aria-label='Rechercher'
          className='flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground'
        />
      </div>
    </header>
  )
}
