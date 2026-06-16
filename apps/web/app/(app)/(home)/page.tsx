"use client"

import { useState } from "react"
import { HomeHeader } from "@/components/home/home-header"
import HomePost from "@/components/home/home-post"

export default function HomePage() {
  const [feed, setFeed] = useState("forYou")

  return (
    <div>
      <HomeHeader feed={feed} onFeedChange={setFeed} />
      <HomePost
        id='1'
        name='John Doe'
        username='johndoe'
        content='This is a sample post content. It can be multiple lines and contain various information.'
        createdAt='2h'
        initialLikes={42}
        initialComments={5}
      />
      <HomePost
        id='1'
        name='John Doe'
        username='johndoe'
        content='This is a sample post content. It can be multiple lines and contain various information.'
        createdAt='2h'
        initialLikes={42}
        initialComments={5}
      />
    </div>
  )
}
