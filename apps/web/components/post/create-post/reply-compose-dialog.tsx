"use client"

import { useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Dialog, DialogContent, DialogPortal } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { PostForm } from "./post-form"
import { PostBottomBar } from "./post-bottom-bar"
import { PostHeader } from "./post-header"
import { PostContent } from ".."
import { ProfileAvatar } from "@/components/profile"
import { UsernameDisplay } from "@/components/shared/username-display"
import { usePostCompose } from "./use-post-compose"

const CLOSE_ANIMATION_DURATION = 100

interface ReplyComposeDialogProps {
  postId: string
  parentName: string
  parentUsername: string
  parentAvatarUrl?: string
  parentContent: string
  onSuccess: () => void
  onDismiss: () => void
}

export function ReplyComposeDialog({
  postId,
  parentName,
  parentUsername,
  parentAvatarUrl,
  parentContent,
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

  const dialogContent = (
    <div className='flex flex-1 flex-col overflow-hidden'>
      <div className='flex flex-1 flex-col overflow-y-auto'>
        <div className='flex gap-2.5 px-4 pt-2 pb-1'>
          <div className='flex shrink-0 flex-col items-center'>
            <ProfileAvatar src={parentAvatarUrl} alt={parentName} size='2xs' />
            <div className='my-1.5 w-px flex-1 bg-border' />
          </div>
          <div className='min-w-0 flex-1 pb-3'>
            <div className='flex items-center gap-1.5'>
              <UsernameDisplay
                name={parentName}
                nameClassName='truncate text-sm font-semibold hover:underline'
              />
              <span className='truncate text-xs text-muted-foreground'>@{parentUsername}</span>
            </div>
            <PostContent
              content={
                parentContent.length > 250 ? parentContent.slice(0, 250) + "…" : parentContent
              }
            />
            <div className='mt-2 text-sm text-muted-foreground'>
              Replying to <span className='font-semibold text-primary'>@{parentUsername}</span>
            </div>
          </div>
        </div>

        <PostForm {...formProps} hideBottomBar noMaxHeight />
      </div>

      <PostBottomBar
        onAddMedia={formProps.onAddMedia}
        onSelectGif={formProps.onSelectGif}
        charCount={compose.content.length}
      />
    </div>
  )

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogPortal>
          <DialogPrimitive.Popup className='fixed inset-0 z-50 flex flex-col bg-background'>
            <PostHeader onPost={handlePost} onClose={handleClose} posting={compose.submitting} />
            {dialogContent}
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className='z-50 flex h-[70vh] flex-col gap-0 overflow-hidden p-0 sm:top-4 sm:max-w-lg sm:rounded-[min(var(--radius-4xl),24px)]'
      >
        <PostHeader onPost={handlePost} onClose={handleClose} posting={compose.submitting} />
        {dialogContent}
      </DialogContent>
    </Dialog>
  )
}
