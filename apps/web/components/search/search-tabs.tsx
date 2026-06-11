"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { IconFileText, IconUser, IconPhoto } from "@tabler/icons-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tab)
    router.push(`/search?${params.toString()}`)
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setTab}
      className='fixed top-15 z-10 w-full bg-background lg:w-[calc(100%-256px)]'
    >
      <TabsList variant='line' className='w-full'>
        {TABS.map((t) => (
          <TabsTrigger key={t.key} value={t.key} className='flex-1'>
            {t.icon}
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
