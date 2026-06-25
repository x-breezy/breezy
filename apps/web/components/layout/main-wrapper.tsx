"use client"

import { usePathname } from "next/navigation"

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <main
      className={`min-w-0 flex-1 border-x lg:pb-0 ${pathname.startsWith("/messages") ? "pb-0" : "pb-15"}`}
    >
      {children}
    </main>
  )
}
