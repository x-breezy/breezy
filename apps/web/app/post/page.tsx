"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { PostHeader } from "@/components/post/PostHeader"
import { PostBottomBar } from "@/components/post/PostBottomBar"

export default function PostPage() {
  const [content, setContent] = useState("")
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handlePost() {
    if (!content.trim()) return
    router.back()
  }

  return (
    <div className='flex h-dvh flex-col'>
      <PostHeader onPost={handlePost} />

      <div className='flex h-auto flex-1 gap-3 overflow-y-auto px-4 py-4'>
        <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-700 text-sm font-semibold text-white'>
          G
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder='Quoi de neuf ?'
          className='mt-2 flex-1 resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground'
          autoFocus
        />
      </div>

      <PostBottomBar />
    </div>
  )
}
