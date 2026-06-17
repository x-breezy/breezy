"use client"

import { useState } from "react"
import { HomeHeader } from "@/components/home/home-header"
import { Feed } from "@/components/post/feed"

export default function HomePage() {
  const [feed, setFeed] = useState("forYou")

  return (
    <div>
      <HomeHeader feed={feed} onFeedChange={setFeed} />
      <div className='container-center w-full py-2'>
        <Feed />
      </div>
    </div>
  )
}
