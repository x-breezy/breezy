"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { IconFileText, IconUser, IconPhoto } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { parseTab, type Tab } from "./types"

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "posts", label: "Posts", icon: <IconFileText size={16} /> },
  { key: "people", label: "People", icon: <IconUser size={16} /> },
  { key: "media", label: "Media", icon: <IconPhoto size={16} /> },
]

export function SearchTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = parseTab(searchParams.get("tab"))

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className='flex items-center justify-around border-b border-border'>
      {TABS.map((t) => (
        <div key={t.key} className='flex flex-1 items-center justify-center'>
          <button
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors",
              activeTab === t.key
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        </div>
      ))}
    </div>
  )
}
