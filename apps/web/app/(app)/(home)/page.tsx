"use client"

import { useState } from "react"
import { HomeHeader } from "@/components/home/home-header"
import { Feed } from "@/components/post/feed"

export default function HomePage() {
  const [feed, setFeed] = useState("For you")

  return (
    <div>
      <HomeHeader feed={feed} onFeedChange={setFeed} />
      <Feed />
    </div>
  )
}
