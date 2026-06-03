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
        {active("/home") ? <IconHomeFilled size={30} className='text-foreground' /> : <IconHome size={30} />}
      </a>
      <a href='/search' className='flex w-full items-center justify-center'>
        <IconSearch size={30} strokeWidth={active("/search") ? 3 : 2} />
      </a>
      <a href='/grod' className='flex w-full items-center justify-center'>
        {active("/grod") ? (
          <img src='/breezy_icon_green.svg' alt='Breezy' className='h-10 w-10 rounded-sm' />
        ) : (
          <img src='/breezy_icon.svg' alt='Breezy' className='h-7 w-7' />
        )}
      </a>
      <a href='/messages' className='flex w-full items-center justify-center'>
        {active("/messages") ? (
          <IconMessageCircleFilled size={30} className='text-foreground' />
        ) : (
          <IconMessageCircle size={30} />
        )}
      </a>
      <a href='/profile' className='flex w-full items-center justify-center'>
        {active("/profile") ? <IconUserFilled size={30} className='text-foreground' /> : <IconUser size={30} />}
      </a>
    </nav>
  )
}
