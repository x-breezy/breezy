"use client"

import { usePathname } from "next/navigation"
import {
  IconHome,
  IconHomeFilled,
  IconMessageCircle,
  IconMessageCircleFilled,
  IconSearch,
  IconUser,
  IconUserFilled,
} from "@tabler/icons-react"

export function NavBar() {
  const pathname = usePathname()
  const active = (href: string) => pathname === href

  return (
    <nav className='grid h-12 w-screen grid-cols-5 border-t'>
      <a href='/home' className='flex w-full items-center justify-center'>
        {active("/home") ? (
          <IconHomeFilled size={24} className='text-foreground' />
        ) : (
          <IconHome size={24} className='text-muted-foreground' />
        )}
      </a>
      <a href='/search' className='flex w-full items-center justify-center'>
        <IconSearch
          size={24}
          strokeWidth={active("/search") ? 2.5 : 1.5}
          className={active("/search") ? "text-foreground" : "text-muted-foreground"}
        />
      </a>
      <a href='/grod' className='flex w-full items-center justify-center'>
        <img src='/breezy_icon.svg' alt='Breezy' className='h-6 w-6' />
      </a>
      <a href='/messages' className='flex w-full items-center justify-center'>
        {active("/messages") ? (
          <IconMessageCircleFilled size={24} className='text-foreground' />
        ) : (
          <IconMessageCircle size={24} className='text-muted-foreground' />
        )}
      </a>
      <a href='/profile' className='flex w-full items-center justify-center'>
        {active("/profile") ? (
          <IconUserFilled size={24} className='text-foreground' />
        ) : (
          <IconUser size={24} className='text-muted-foreground' />
        )}
      </a>
    </nav>
  )
}
