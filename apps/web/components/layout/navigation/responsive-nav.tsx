"use client"

import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { HomeIcon, SearchIcon, GrodIcon, SendIcon, ProfileIcon } from "./icons"
import { NavItem } from "./nav-item"
import { useUserStore } from "@/stores/user-store"
import type { NavItemData } from "./types"
import Link from "next/link"

function getNavItems(t: any): NavItemData[] {
  return [
    { href: "/", icon: HomeIcon, label: t("home") },
    { href: "/search", icon: SearchIcon, label: t("search") },
    { href: "/grod", icon: GrodIcon, label: t("grod") },
    { href: "/messages", icon: SendIcon, label: t("messages") },
  ]
}

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
  const t = useTranslations("nav")
  const profile = useUserStore((s) => s.profile)
  const ProfileNavIcon = makeProfileIcon(profile?.avatarId ?? null)
  const isProfileActive = pathname === `/profile/${profile?.username}`

  const navItems = getNavItems(t)

  return (
    <>
      {/* Mobile: Bottom bar - visible en dessous de lg */}
      <nav className='fixed right-0 bottom-0 left-0 z-50 grid h-15 grid-cols-5 border-t bg-background pb-[env(safe-area-inset-bottom)] lg:hidden'>
        {navItems.map(({ href, icon, label }) => (
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
          href={`/profile/${profile?.username}`}
          icon={ProfileNavIcon}
          label={t("profile")}
          isActive={isProfileActive}
          showLabel={false}
          iconClassName='block size-6'
        />
      </nav>

      {/* Desktop: Sidebar - visible à partir de lg */}
      <aside className='hidden h-full min-w-64 shrink-0 flex-col bg-background py-6 lg:flex'>
        <div className='px-6 pb-6'>
          <Link href='/' className='font-geom text-xl font-bold'>
            Breezy
          </Link>
        </div>
        <nav className='flex flex-1 flex-col gap-2 pr-2'>
          {navItems.map(({ href, icon, label }) => (
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
            href={`/profile/${profile?.username}`}
            icon={ProfileNavIcon}
            label={t("profile")}
            isActive={isProfileActive}
            showLabel={true}
            iconClassName='block size-7'
          />
        </nav>
      </aside>
    </>
  )
}
