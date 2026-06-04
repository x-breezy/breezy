"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarImage } from "@breezy/ui/components/avatar"
import { cn } from "@breezy/ui/lib/utils"
import { buttonVariants } from "@breezy/ui/components/button"

export function NavBar() {
  const pathname = usePathname()
  const active = (href: string) => pathname === href

  return (
    <nav className='grid h-15 w-screen grid-cols-5 border-t'>
      <Link
        href='/'
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-full w-full rounded-none"
        )}
      >
        {active("/") ? (
          <Image
            src='/navbar/home_hover.svg'
            alt='Home'
            width={24}
            height={24}
            className='h-6 w-6'
          />
        ) : (
          <Image src='/navbar/home.svg' alt='Home' width={24} height={24} className='h-6 w-6' />
        )}
      </Link>
      <Link
        href='/search'
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-full w-full rounded-none"
        )}
      >
        {active("/search") ? (
          <Image
            src='/navbar/search_hover.svg'
            alt='Search'
            width={24}
            height={24}
            className='h-6 w-6'
          />
        ) : (
          <Image src='/navbar/search.svg' alt='Search' width={24} height={24} className='h-6 w-6' />
        )}
      </Link>
      <Link
        href='/grod'
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-full w-full rounded-none"
        )}
      >
        {active("/grod") ? (
          <span className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary'>
            <span
              className='block h-5 w-5 bg-white'
              style={{
                WebkitMaskImage: "url('/navbar/breezy_icon.svg')",
                maskImage: "url('/navbar/breezy_icon.svg')",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "center",
              }}
            />
          </span>
        ) : (
          <Image
            src='/navbar/breezy_icon.svg'
            alt='Breezy'
            width={24}
            height={24}
            className='h-6 w-6'
          />
        )}
      </Link>
      <Link
        href='/messages'
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-full w-full rounded-none"
        )}
      >
        {active("/messages") ? (
          <Image
            src='/navbar/send_hover.svg'
            alt='Send'
            width={24}
            height={24}
            className='h-6 w-6'
          />
        ) : (
          <Image src='/navbar/send.svg' alt='Send' width={24} height={24} className='h-6 w-6' />
        )}
      </Link>
      <Link
        href='/profile'
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-full w-full rounded-none"
        )}
      >
        <Avatar
          size='sm'
          className={active("/profile") ? "ring-2 ring-foreground ring-offset-1" : ""}
        >
          <AvatarImage src='/navbar/pp_test.png' alt='Profile' />
        </Avatar>
      </Link>
    </nav>
  )
}
