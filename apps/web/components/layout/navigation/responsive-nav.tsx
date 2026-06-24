"use client"

import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { HomeIcon, SearchIcon, SendIcon, ProfileIcon } from "./icons"
import { NavItem } from "./nav-item"
import { useUserStore } from "@/stores/user-store"
import type { NavItemData } from "./types"
import Link from "next/link"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { ModerationIcon } from "./icons/moderation-icon"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNavItems(t: any, unreadCount: number): NavItemData[] {
  return [
    { href: "/", icon: HomeIcon, label: t("home") },
    { href: "/search", icon: SearchIcon, label: t("search") },
    { href: "/messages", icon: SendIcon, label: t("messages"), badgeCount: unreadCount },
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
  const user = useUserStore((s) => s.user)
  const ProfileNavIcon = makeProfileIcon(profile?.avatarId ?? null)
  const isProfileActive = pathname === `/profile/${profile?.username}`
  const isConversationPage = pathname.startsWith("/messages/")

  const unreadCount = useUnreadMessages()
  const navItems = getNavItems(t, unreadCount)
  const isModerator = user?.role === "moderator" || user?.role === "admin"

  return (
    <>
      {/* Mobile: Bottom bar - visible en dessous de lg */}
      <nav
        className={`${isConversationPage ? "hidden" : "grid lg:hidden"} fixed right-0 bottom-0 left-0 z-50 grid h-15 border-t bg-background pb-[env(safe-area-inset-bottom)]`}
        style={{ gridTemplateColumns: `repeat(${isModerator ? 5 : 4}, 1fr)` }}
      >
        {navItems.map(({ href, icon, label, badgeCount }) => (
          <NavItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            isActive={pathname === href}
            showLabel={false}
            iconClassName='block size-6'
            badgeCount={badgeCount}
          />
        ))}
        {isModerator && (
          <NavItem
            href='/moderation'
            icon={ModerationIcon}
            label={t("moderation")}
            isActive={pathname === "/moderation"}
            showLabel={false}
            iconClassName='block size-6'
          />
        )}
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
      <aside className='sticky top-0 hidden h-dvh min-w-64 shrink-0 flex-col self-start bg-background py-6 lg:flex'>
        <div className='px-6 pb-6'>
          <Link href='/' className='font-geom text-xl font-bold'>
            Breezy
          </Link>
        </div>
        <nav className='flex flex-1 flex-col gap-2 pr-2'>
          {navItems.map(({ href, icon, label, badgeCount }) => (
            <NavItem
              key={href}
              href={href}
              icon={icon}
              label={label}
              isActive={pathname === href}
              showLabel={true}
              iconClassName='block size-7'
              badgeCount={badgeCount}
            />
          ))}
          {isModerator && (
            <NavItem
              href='/moderation'
              icon={ModerationIcon}
              label={t("moderation")}
              isActive={pathname === "/moderation"}
              showLabel={true}
              iconClassName='block size-7'
            />
          )}
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
