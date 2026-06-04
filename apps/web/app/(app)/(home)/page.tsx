"use client"

import { useState } from "react"
import { HomeHeader } from "@/components/home/HomeHeader"

export default function HomePage() {
  const [feed, setFeed] = useState("For you")

  return (
    <div>
      <HomeHeader feed={feed} onFeedChange={setFeed} />
    </div>
  )
}
