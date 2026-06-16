"use client"

import { useState, useCallback } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Dialog, DialogContent, DialogPortal } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { PostForm } from "./PostForm"
import { PostHeader } from "./PostHeader"
import { usePostCompose } from "./use-post-compose"

const CLOSE_ANIMATION_DURATION = 100

interface ReplyComposeDialogProps {
  postId: string
  parentUsername: string
  onSuccess: () => void
  onDismiss: () => void
}

export function ReplyComposeDialog({
  postId,
  parentUsername,
  onSuccess,
  onDismiss,
}: ReplyComposeDialogProps) {
  const [open, setOpen] = useState(true)
  const isMobile = useIsMobile()
  const compose = usePostCompose(postId)

  function handleClose() {
    if (isMobile) {
      onDismiss()
    } else {
      setOpen(false)
      setTimeout(onDismiss, CLOSE_ANIMATION_DURATION)
    }
  }

  async function handlePost() {
    const ok = await compose.submit()
    if (ok) {
      onSuccess()
      handleClose()
    }
  }

  const formProps = {
    content: compose.content,
    setContent: compose.setContent,
    mediaFiles: compose.mediaFiles,
    onRemoveMedia: compose.removeMedia,
    onAddMedia: compose.addMedia,
    onSelectGif: (file: File) => compose.addMedia([file]),
    onMentionResolved: compose.resolveMention,
  }

  const replyBanner = (
    <p className='px-4 pt-1 pb-2 text-sm text-muted-foreground'>
      Replying to <span className='text-primary'>@{parentUsername}</span>
    </p>
  )

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogPortal>
          <DialogPrimitive.Popup className='fixed inset-0 z-50 flex flex-col bg-background'>
            <PostHeader onPost={handlePost} onClose={handleClose} posting={compose.submitting} />
            {replyBanner}
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
        className='z-50 flex h-[60vh] flex-col gap-0 overflow-hidden p-0 sm:top-4 sm:max-w-lg sm:rounded-[min(var(--radius-4xl),24px)]'
      >
        <PostHeader onPost={handlePost} onClose={handleClose} posting={compose.submitting} />
        {replyBanner}
        <PostForm {...formProps} />
      </DialogContent>
    </Dialog>
  )
}
