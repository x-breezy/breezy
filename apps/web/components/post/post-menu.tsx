"use client"

import { useState } from "react"
import { IconDots, IconShare, IconFlag, IconPencil, IconTrash } from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { reportProfile } from "@/lib/actions/reports"
import { deletePost, updatePost, type SearchPostMedia } from "@/lib/actions/posts"
import { uploadMediaAction } from "@/lib/actions/media"
import { useUserStore } from "@/stores/user-store"
import { PostComposeDialog } from "./create-post/post-compose-dialog"
import type { MediaPreview } from "./create-post/use-post-compose"

interface PostMenuProps {
  postId: string
  username: string
  authorId: string
  content: string
  media?: SearchPostMedia[]
  onDeleted?: () => void
  onEdited?: (newContent: string, newMedia: SearchPostMedia[]) => void
}

export function PostMenu({
  postId,
  username,
  authorId,
  content,
  media,
  onDeleted,
  onEdited,
}: PostMenuProps) {
  const currentProfileId = useUserStore((s) => s.profile?.profileId)
  const currentUserRole = useUserStore((s) => s.user?.role)
  const isOwner = currentProfileId === authorId
  const isModerator = currentUserRole === "moderator" || currentUserRole === "admin"

  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const postUrl = `${window.location.origin}/post/${username}/${postId}`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ url: postUrl })
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") throw e
      }
    } else {
      await navigator.clipboard.writeText(postUrl)
    }
  }

  async function handleReport() {
    if (!reason.trim()) return
    await reportProfile(authorId, reason)
    setReportOpen(false)
    setReason("")
  }

  async function handleEditSubmit(
    newContent: string,
    newFiles: MediaPreview[],
    keptMedia: SearchPostMedia[]
  ): Promise<boolean> {
    const uploadedNew =
      newFiles.length > 0 ? await Promise.all(newFiles.map((m) => uploadMediaAction(m.file))) : []
    const finalMedia = [...keptMedia, ...uploadedNew]
    await updatePost(postId, newContent, finalMedia)
    onEdited?.(newContent, finalMedia)
    return true
  }

  async function handleDelete() {
    await deletePost(postId)
    setDeleteOpen(false)
    onDeleted?.()
  }

  return (
    // stops React portal synthetic event bubbling to the article onClick
    <div onClick={(e) => e.stopPropagation()} className='contents'>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              size='icon-xs'
              aria-label='More options'
              className='-mr-1 text-muted-foreground transition hover:text-foreground'
              onClick={(e) => e.stopPropagation()}
            >
              <IconDots className='size-4' aria-hidden='true' />
            </Button>
          }
        />
        <DropdownMenuContent align='start'>
          <DropdownMenuItem
            onClick={handleShare}
            className='px-3 py-2.5 text-base md:px-2 md:py-1.5 md:text-sm'
          >
            <IconShare />
            Share
          </DropdownMenuItem>
          {isOwner && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setEditOpen(true)}
                className='px-3 py-2.5 text-base md:px-2 md:py-1.5 md:text-sm'
              >
                <IconPencil />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setDeleteOpen(true)}
                className='px-3 py-2.5 text-base md:px-2 md:py-1.5 md:text-sm'
              >
                <IconTrash />
                Delete
              </DropdownMenuItem>
            </>
          )}
          {!isOwner && (
            <>
              <DropdownMenuSeparator />
              {isModerator && (
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => setDeleteOpen(true)}
                  className='px-3 py-2.5 text-base md:px-2 md:py-1.5 md:text-sm'
                >
                  <IconTrash />
                  Delete (mod)
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant='destructive'
                onClick={() => setReportOpen(true)}
                className='px-3 py-2.5 text-base md:px-2 md:py-1.5 md:text-sm'
              >
                <IconFlag />
                Report
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {editOpen && (
        <PostComposeDialog
          initialContent={content}
          initialMedia={media}
          onSubmit={handleEditSubmit}
          onDismiss={() => setEditOpen(false)}
          postLabel='Save'
        />
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Popup className='fixed top-1/2 left-1/2 z-120 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-[min(var(--radius-4xl),24px)] bg-popover p-6 text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'>
            <div className='flex flex-col gap-5'>
              <div className='flex flex-col gap-1'>
                <DialogPrimitive.Title className='font-heading text-base font-medium'>
                  Delete post?
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className='text-sm text-muted-foreground'>
                  This cannot be undone.
                </DialogPrimitive.Description>
              </div>
              <div className='flex justify-center gap-2'>
                <DialogPrimitive.Close
                  render={<Button size='lg' className='w-1/2' variant='secondary' />}
                >
                  Cancel
                </DialogPrimitive.Close>
                <Button variant='destructive' className='w-1/2' size='lg' onClick={handleDelete}>
                  <IconTrash />
                  Delete
                </Button>
              </div>
            </div>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Popup className='fixed top-1/2 left-1/2 z-120 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-[min(var(--radius-4xl),24px)] bg-popover p-6 text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'>
            <div className='flex flex-col gap-5'>
              <div className='flex flex-col gap-1'>
                <DialogPrimitive.Title className='font-heading text-base font-medium'>
                  Report this post?
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className='text-sm text-muted-foreground'>
                  Describe why you are reporting this post.
                </DialogPrimitive.Description>
              </div>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder='Reason...'
              />
              <div className='flex justify-center gap-2'>
                <DialogPrimitive.Close
                  render={<Button size='lg' className='w-1/2' variant='secondary' />}
                  onClick={() => setReason("")}
                >
                  Cancel
                </DialogPrimitive.Close>
                <Button
                  variant='destructive'
                  className='w-1/2'
                  size='lg'
                  onClick={handleReport}
                  disabled={!reason.trim()}
                >
                  <IconFlag />
                  Report
                </Button>
              </div>
            </div>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    </div>
  )
}
