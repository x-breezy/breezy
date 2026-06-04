"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogPortal } from "@breezy/ui/components/dialog"
import { PostHeader } from "@/components/post/PostHeader"
import { PostForm } from "@/components/post/PostForm"
import { useIsMobile } from "@/hooks/use-is-mobile"

export function PostComposeDialog({ onDismiss }: { onDismiss: () => void }) {
  const [content, setContent] = useState("")
  const [open, setOpen] = useState(true)
  const isMobile = useIsMobile()

  function handleClose() {
    if (isMobile) {
      onDismiss()
    } else {
      setOpen(false)
      setTimeout(onDismiss, 100)
    }
  }

  function handlePost() {
    if (!content.trim()) return
    handleClose()
  }

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogPortal>
          <div className='fixed inset-0 z-50 flex flex-col bg-background'>
            <PostHeader onPost={handlePost} onClose={handleClose} />
            <PostForm content={content} setContent={setContent} />
          </div>
        </DialogPortal>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className='flex flex-col gap-0 p-0 sm:top-[20%] sm:max-w-lg sm:rounded-[min(var(--radius-4xl),24px)]'
      >
        <PostHeader onPost={handlePost} onClose={handleClose} />
        <PostForm content={content} setContent={setContent} />
      </DialogContent>
    </Dialog>
  )
}
