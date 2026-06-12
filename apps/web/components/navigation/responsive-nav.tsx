"use client"

import { usePathname } from "next/navigation"
import { HomeIcon, SearchIcon, GrodIcon, SendIcon, ProfileIcon } from "@/components/icons"
import { NavItem } from "./nav-item"
import { useUserStore } from "@/stores/user-store"
import type { NavItemData } from "./types"

const NAV_ITEMS: NavItemData[] = [
  { href: "/", icon: HomeIcon, label: "Home" },
  { href: "/search", icon: SearchIcon, label: "Search" },
  { href: "/grod", icon: GrodIcon, label: "Grod" },
  { href: "/messages", icon: SendIcon, label: "Messages" },
]

function makeProfileIcon(avatarId: string | null) {
  return function ProfileNavIcon({ active, className }: { active?: boolean; className?: string }) {
    if (avatarId) {
      return <ProfileIcon src={avatarId} active={active} className={className} />
    }
    return <ProfileIcon active={active} className={className} />
  }
}

export function ResponsiveNav() {
  const pathname = usePathname()
  const profile = useUserStore((s) => s.profile)
  const ProfileNavIcon = makeProfileIcon(profile?.avatarId ?? null)
  const isProfileActive = pathname === "/my-profile"

  const isConversationPage = pathname.startsWith("/messages/")

  return (
    <>
      {/* Mobile: Bottom bar - visible en dessous de lg */}
      <nav className={`fixed right-0 bottom-0 left-0 z-50 h-15 grid-cols-5 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden ${isConversationPage ? "hidden" : "grid"}`}>
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
          href='/my-profile'
          icon={ProfileNavIcon}
          label='Profile'
          isActive={isProfileActive}
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
            href='/my-profile'
            icon={ProfileNavIcon}
            label='Profile'
            isActive={isProfileActive}
            showLabel={true}
            iconClassName='block size-7'
          />
        </nav>
      </aside>
    </>
  )
}
