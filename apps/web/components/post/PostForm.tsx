"use client"

import { useRef } from "react"
import { Textarea } from "@breezy/ui/components/textarea"
import { Avatar, AvatarFallback } from "@breezy/ui/components/avatar"
import { PostBottomBar } from "@/components/post/PostBottomBar"

export function PostForm({
  content,
  setContent,
}: {
  content: string
  setContent: (value: string) => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <>
      <div className='flex max-h-[375px] flex-1 gap-3 overflow-y-auto px-4 py-4'>
        <Avatar size='lg'>
          <AvatarFallback className='bg-amber-700 text-white'>G</AvatarFallback>
        </Avatar>
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          className='min-h-50 flex-1 rounded-none border-none bg-transparent px-0 pt-0 text-xl placeholder:text-muted-foreground/60 focus-visible:ring-0'
          autoFocus
        />
      </div>
      <div className='shrink-0'>
        <PostBottomBar />
      </div>
    </>
  )
}
