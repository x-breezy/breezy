"use client"

import { useState } from "react"
import { HomeHeader } from "@/components/post/home-header"
import { Feed } from "@/components/post/feed"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function HomePage() {
  const [feed, setFeed] = useState("forYou")

  return (
    <ScrollArea className='h-full'>
      <HomeHeader feed={feed} onFeedChange={setFeed} />
      <div className='container-center w-full py-2'>
        <Feed key={feed} feedType={feed} />
      </div>
    </ScrollArea>
  )
}
