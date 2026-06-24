"use client"

import { useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Dialog, DialogContent, DialogPortal } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { useTranslations } from "next-intl"
import { PostForm } from "./post-form"
import { PostHeader } from "./post-header"
import { usePostCompose, type MediaPreview } from "./use-post-compose"
import type { SearchPostMedia } from "@/lib/actions/posts"

const CLOSE_ANIMATION_DURATION = 100 // ms for dialog close animation

interface PostComposeDialogProps {
  onDismiss: () => void
  initialContent?: string
  initialMedia?: SearchPostMedia[]
  onSubmit?: (
    content: string,
    newFiles: MediaPreview[],
    keptMedia: SearchPostMedia[]
  ) => Promise<boolean>
  postLabel?: string
}

export function PostComposeDialog({
  onDismiss,
  initialContent,
  initialMedia,
  onSubmit,
  postLabel,
}: PostComposeDialogProps) {
  const [open, setOpen] = useState(true)
  const [keptExisting, setKeptExisting] = useState<SearchPostMedia[]>(initialMedia ?? [])
  const [editError, setEditError] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const compose = usePostCompose(undefined, initialContent ?? "")
  const t = useTranslations("composePost")

  function handleClose() {
    if (isMobile) {
      onDismiss()
    } else {
      setOpen(false)
      setTimeout(onDismiss, CLOSE_ANIMATION_DURATION)
    }
  }

  async function handlePost() {
    if (onSubmit) {
      try {
        const ok = await onSubmit(compose.content, compose.mediaFiles, keptExisting)
        if (ok) handleClose()
      } catch (e) {
        if (e instanceof Error && (e.message === "FILE_TOO_LARGE" || e.message.includes("413"))) {
          setEditError(t("tooLarge", { type: "File", size: 10 }))
        } else {
          setEditError(t("failedToSave"))
        }
      }
    } else {
      const ok = await compose.submit()
      if (ok) handleClose()
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
    existingMedia: keptExisting,
    onRemoveExistingMedia: (i: number) =>
      setKeptExisting((prev) => prev.filter((_, idx) => idx !== i)),
  }

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogPortal>
          <DialogPrimitive.Popup className='fixed inset-0 z-50 flex flex-col bg-background'>
            <PostHeader
              onPost={handlePost}
              onClose={handleClose}
              posting={compose.submitting}
              disabled={compose.content.trim().length === 0 || compose.content.length > 250}
              label={postLabel}
            />
            {(compose.error ?? editError) && (
              <p className='px-4 pt-2 text-sm text-destructive'>{compose.error ?? editError}</p>
            )}
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
        <PostHeader
          onPost={handlePost}
          onClose={handleClose}
          posting={compose.submitting}
          disabled={compose.content.trim().length === 0 || compose.content.length > 250}
          label={postLabel}
        />
        {(compose.error ?? editError) && (
          <p className='px-4 pt-2 text-sm text-destructive'>{compose.error ?? editError}</p>
        )}
        <PostForm {...formProps} />
      </DialogContent>
    </Dialog>
  )
}
