"use client"

import { usePathname } from "next/navigation"
import { RightSidebar } from "./right-sidebar"
import type { SearchProfile } from "@/lib/actions/profiles"

export function RightSidebarConditional({ suggestedUsers }: { suggestedUsers: SearchProfile[] }) {
  const pathname = usePathname()
  if (pathname.startsWith("/messages")) return null
  return (
    <aside className='hidden w-[350px] shrink-0 overflow-y-auto xl:block'>
      <RightSidebar suggestedUsers={suggestedUsers} />
    </aside>
  )
}
