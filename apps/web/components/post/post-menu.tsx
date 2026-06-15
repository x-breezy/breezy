"use client"

import { useState } from "react"
import { IconDots, IconShare, IconFlag } from "@tabler/icons-react"
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

interface PostMenuProps {
  postId: string
  username: string
  authorId: string
}

export function PostMenu({ postId, username, authorId }: PostMenuProps) {
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState("")

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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              aria-label='More options'
              className='-mr-1 p-1 text-muted-foreground transition hover:text-foreground'
            >
              <IconDots className='size-4' aria-hidden='true' />
            </button>
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
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant='destructive'
            onClick={() => setReportOpen(true)}
            className='px-3 py-2.5 text-base md:px-2 md:py-1.5 md:text-sm'
          >
            <IconFlag />
            Report
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  )
}
