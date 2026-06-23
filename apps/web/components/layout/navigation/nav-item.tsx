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
  hasBadge = false,
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
        {hasBadge && (
          <span className='absolute -top-1 -right-1 flex h-2.5 w-2.5'>
            <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75'></span>
            <span className='relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background'></span>
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
