"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { NavItemProps } from "./types"

export function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
  showLabel = false,
  iconClassName = "size-6",
  badgeCount = 0,
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "flex items-center justify-center gap-3 border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
        showLabel ? "h-12 w-full justify-start px-4" : "h-full w-full",
        isActive && "lg:bg-muted"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <div className='relative inline-flex items-center justify-center'>
        <Icon active={isActive} className={iconClassName} />
        {badgeCount > 0 && (
          <span className='absolute -top-1.5 -right-1.5 flex min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-5 font-bold text-primary-foreground ring-2 ring-background'>
            {badgeCount > 9 ? "9+" : badgeCount}
          </span>
        )}
      </div>

      {showLabel && (
        <span className={cn("text-sm", isActive ? "font-bold" : "font-medium")}>{label}</span>
      )}
      {!showLabel && <span className='sr-only'>{label}</span>}
    </Link>
  )
}
