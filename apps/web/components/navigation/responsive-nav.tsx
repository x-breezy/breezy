"use client"

import { usePathname } from "next/navigation"
import { HomeIcon, SearchIcon, GrodIcon, SendIcon, ProfileIcon } from "@/components/icons"
import { NavItem } from "./nav-item"
import type { NavItemData } from "./types"

const NAV_ITEMS: NavItemData[] = [
  { href: "/", icon: HomeIcon, label: "Home" },
  { href: "/search", icon: SearchIcon, label: "Search" },
  { href: "/grod", icon: GrodIcon, label: "Grod" },
  { href: "/messages", icon: SendIcon, label: "Messages" },
]

export function ResponsiveNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile: Bottom bar - visible en dessous de lg */}
      <nav className='fixed right-0 bottom-0 left-0 z-50 grid h-15 grid-cols-5 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden'>
        {NAV_ITEMS.map(({ href, icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            isActive={pathname === href}
            showLabel={false}
            iconClassName='block size-6'
          />
        ))}
        <NavItem
          href='/profile'
          icon={ProfileIcon}
          label='Profile'
          isActive={pathname === "/profile"}
          showLabel={false}
          iconClassName='block size-6'
        />
      </nav>

      {/* Desktop: Sidebar - visible à partir de lg */}
      <aside className='fixed top-0 left-0 z-50 hidden h-screen w-64 flex-col border-r bg-background py-6 lg:flex'>
        <div className='px-6 pb-6'>
          <span className='font-geom text-xl font-bold'>Breezy</span>
        </div>
        <nav className='flex flex-1 flex-col gap-1'>
          {NAV_ITEMS.map(({ href, icon, label }) => (
            <NavItem
              key={href}
              href={href}
              icon={icon}
              label={label}
              isActive={pathname === href}
              showLabel={true}
              iconClassName='block size-7'
            />
          ))}
          <NavItem
            href='/profile'
            icon={ProfileIcon}
            label='Profile'
            isActive={pathname === "/profile"}
            showLabel={true}
            iconClassName='block size-7'
          />
        </nav>
      </aside>
    </>
  )
}
