"use client"

import { usePathname } from "next/navigation"
import { IconHome, IconMessageCircle, IconSearch, IconUser } from "@tabler/icons-react"

export function NavBar() {
  const pathname = usePathname()
  const active = (href: string) => pathname === href

  return (
    <nav className='flex w-screen items-center justify-between border-t px-6 py-3'>
      <a href='/home' className='flex w-auto'>
        <IconHome
          size={24}
          strokeWidth={active("/home") ? 2.5 : 1.5}
          className={active("/home") ? "text-foreground" : "text-muted-foreground"}
        />
      </a>
      <a href='/search'>
        <IconSearch
          size={24}
          strokeWidth={active("/search") ? 2.5 : 1.5}
          className={active("/search") ? "text-foreground" : "text-muted-foreground"}
        />
      </a>
      <a href='/home'>
        <img src='/breezy_icon.svg' alt='Breezy' className='h-6 w-6' />
      </a>
      <a href='/messages'>
        <IconMessageCircle
          size={24}
          strokeWidth={active("/messages") ? 2.5 : 1.5}
          className={active("/messages") ? "text-foreground" : "text-muted-foreground"}
        />
      </a>
      <a href='/profile'>
        <IconUser
          size={24}
          strokeWidth={active("/profile") ? 2.5 : 1.5}
          className={active("/profile") ? "text-foreground" : "text-muted-foreground"}
        />
      </a>
    </nav>
  )
}
