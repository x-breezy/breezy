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
    <nav className='grid h-15 w-screen grid-cols-5 border-t'>
      <a href='/home' className='flex w-full items-center justify-center'>
        {active("/home") ? (
          <img src='/navbar/home_hover.svg' alt='Home' className='h-6 w-6' />
        ) : (
          <img src='/navbar/home.svg' alt='Home' className='h-6 w-6' />
        )}
      </a>
      <a href='/search' className='flex w-full items-center justify-center'>
        {active("/search") ? (
          <img src='/navbar/search_hover.svg' alt='Search' className='h-6 w-6' />
        ) : (
          <img src='/navbar/search.svg' alt='Search' className='h-6 w-6' />
        )}
      </a>
      <a href='/grod' className='flex w-full items-center justify-center'>
        {active("/grod") ? (
          <img src='/navbar/breezy_icon_green.svg' alt='Breezy' className='h-9 w-9 rounded-sm' />
        ) : (
          <img src='/navbar/breezy_icon.svg' alt='Breezy' className='h-6 w-6' />
        )}
      </a>
      <a href='/messages' className='flex w-full items-center justify-center'>
        {active("/messages") ? (
          <img src='/navbar/send_hover.svg' alt='Send' className='h-6 w-6' />
        ) : (
          <img src='/navbar/send.svg' alt='Send' className='h-6 w-6' />
        )}
      </a>
      <a href='/profile' className='flex w-full items-center justify-center'>
        {active("/profile") ? (
          <img src='/navbar/pp_test.png' alt='Profile' className='h-6 w-6 rounded-full border-2 border-black' />
        ) : (
          <img src='/navbar/pp_test.png' alt='Profile' className='h-6 w-6 rounded-full' />
        )}
      </a>
    </nav>
  )
}
