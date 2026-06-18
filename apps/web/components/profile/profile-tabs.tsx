"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { IconFileText, IconMessage2, IconPhoto } from "@tabler/icons-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export type ProfileTab = "posts" | "replies" | "medias"

const VALID_TABS: ProfileTab[] = ["posts", "replies", "medias"]

function parseTab(value: string | null): ProfileTab {
  return VALID_TABS.includes(value as ProfileTab) ? (value as ProfileTab) : "posts"
}

const TABS: { key: ProfileTab; labelKey: string; icon: React.ReactNode }[] = [
  { key: "posts", labelKey: "tabPosts", icon: <IconFileText size={16} /> },
  { key: "replies", labelKey: "tabReplies", icon: <IconMessage2 size={16} /> },
  { key: "medias", labelKey: "tabMedias", icon: <IconPhoto size={16} /> },
]

export function ProfileTabs() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("profilePage")
  const activeTab = parseTab(searchParams.get("tab"))

  function setTab(tab: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (tab === "posts") {
      params.delete("tab")
    } else {
      params.set("tab", tab)
    }
    const qs = params.toString()
    router.push(qs ? `?${qs}` : window.location.pathname)
  }

  return (
    <Tabs value={activeTab} onValueChange={setTab} className='container-center mt-8 mb-4'>
      <TabsList variant='line' className='w-full'>
        {TABS.map((tabItem) => (
          <TabsTrigger key={tabItem.key} value={tabItem.key} className='flex-1'>
            {tabItem.icon}
            {t(tabItem.labelKey)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
