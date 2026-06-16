"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { IconFileText, IconUser, IconPhoto } from "@tabler/icons-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { parseTab, type Tab } from "./types"

const TABS: { key: Tab; labelKey: string; icon: React.ReactNode }[] = [
  { key: "posts", labelKey: "tabPosts", icon: <IconFileText size={16} /> },
  { key: "people", labelKey: "tabPeople", icon: <IconUser size={16} /> },
  { key: "media", labelKey: "tabMedia", icon: <IconPhoto size={16} /> },
]

export function SearchTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("search")
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
      className='container-center sticky top-15 z-10 bg-background'
    >
      <TabsList variant='line' className='w-full'>
        {TABS.map((tabItem) => (
          <TabsTrigger key={tabItem.key} value={tabItem.key} className='flex-1'>
            {tabItem.icon}
            {t(tabItem.labelKey as any)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
