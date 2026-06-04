"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@breezy/ui/lib/utils"
import { buttonVariants } from "@breezy/ui/components/button"
import { HomeIcon, SearchIcon, GrodIcon, SendIcon, ProfileIcon } from "@/components/icons"

const NAV_ITEMS = [
  { href: "/", icon: HomeIcon, label: "Home" },
  { href: "/search", icon: SearchIcon, label: "Search" },
  { href: "/grod", icon: GrodIcon, label: "Grod" },
  { href: "/messages", icon: SendIcon, label: "Messages" },
] as const

function NavLink({
  href,
  isActive,
  children,
}: {
  href: string
  isActive: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "h-full w-full rounded-none",
        isActive && "background"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  )
}

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className='grid h-15 w-screen grid-cols-5 border-t'>
      {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href
        return (
          <NavLink key={href} href={href} isActive={isActive}>
            <Icon active={isActive} className='block size-6' />
            <span className='sr-only'>{label}</span>
          </NavLink>
        )
      })}

      <NavLink href='/profile' isActive={pathname === "/profile"}>
        <ProfileIcon active={pathname === "/profile"} className='block size-6' />
        <span className='sr-only'>Profile</span>
      </NavLink>
    </nav>
  )
}
