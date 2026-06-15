"use client"

import { useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Dialog, DialogContent, DialogPortal } from "@/components/ui/dialog"
import { PostHeader } from "@/components/post/PostHeader"
import { PostForm } from "@/components/post/PostForm"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { usePostCompose } from "@/components/post/use-post-compose"

export function PostComposeDialog({ onDismiss }: { onDismiss: () => void }) {
  const [open, setOpen] = useState(true)
  const isMobile = useIsMobile()
  const compose = usePostCompose()

  function handleClose() {
    if (isMobile) {
      onDismiss()
    } else {
      setOpen(false)
      setTimeout(onDismiss, 100)
    }
  }

  async function handlePost() {
    const ok = await compose.submit()
    if (ok) handleClose()
  }

  const formProps = {
    content: compose.content,
    setContent: compose.setContent,
    mediaFiles: compose.mediaFiles,
    onRemoveMedia: compose.removeMedia,
    onAddMedia: compose.addMedia,
    onMentionResolved: compose.resolveMention,
  }

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogPortal>
          <DialogPrimitive.Popup className='fixed inset-0 z-120 flex flex-col bg-background'>
            <PostHeader onPost={handlePost} onClose={handleClose} posting={compose.submitting} />
            <PostForm {...formProps} />
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className='z-120 flex h-[60vh] flex-col gap-0 overflow-hidden p-0 sm:top-4 sm:max-w-lg sm:rounded-[min(var(--radius-4xl),24px)]'
      >
        <PostHeader onPost={handlePost} onClose={handleClose} posting={compose.submitting} />
        <PostForm {...formProps} />
      </DialogContent>
    </Dialog>
  )
}
