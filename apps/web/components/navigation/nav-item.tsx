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
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "flex items-center justify-center gap-3 rounded-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
        showLabel ? "h-12 w-full justify-start px-4" : "h-full w-full",
        isActive && "lg:bg-muted"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon active={isActive} className={iconClassName} />
      {showLabel && (
        <span className={cn("text-sm", isActive ? "font-bold" : "font-medium")}>{label}</span>
      )}
      {!showLabel && <span className='sr-only'>{label}</span>}
    </Link>
  )
}
