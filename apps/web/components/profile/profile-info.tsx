"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { UserRole } from "@/lib/auth/role"
import { UsernameDisplay } from "@/components/shared/username-display"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { IconDots, IconShare, IconFlag, IconUserOff } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { reportProfile } from "@/lib/actions/reports"

interface ProfileInfoProps {
  name: string
  username: string
  userId: string
  role?: UserRole
  className?: string
  isOwn?: boolean
}

export function ProfileInfo({
  name,
  username,
  userId,
  role = UserRole.User,
  className,
  isOwn,
}: ProfileInfoProps) {
  const [reportOpen, setReportOpen] = useState(false)
  const [reason, setReason] = useState("")

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: name, url: window.location.href })
      } catch (e) {
        if (e instanceof Error && e.name !== "AbortError") throw e
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
    }
  }

  async function handleReport() {
    if (!reason.trim()) return
    await reportProfile(userId, reason)
    setReportOpen(false)
    setReason("")
  }

  return (
    <>
      <div className={cn("flex flex-col items-center", className)}>
        <div className='flex items-center gap-1'>
          <h1>
            <UsernameDisplay name={name} role={role} nameClassName='text-2xl font-bold' />
          </h1>
          {!isOwn && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant='ghost' size='icon' className='size-7 rounded-full' />}
              >
                <IconDots className='size-4' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='start'>
                <DropdownMenuItem
                  onClick={handleShare}
                  className="px-3 py-2.5 text-base md:px-2 md:py-1.5 md:text-sm [&_svg:not([class*='size-'])]:size-5 md:[&_svg:not([class*='size-'])]:size-4"
                >
                  <IconShare />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => setReportOpen(true)}
                  className="px-3 py-2.5 text-base md:px-2 md:py-1.5 md:text-sm [&_svg:not([class*='size-'])]:size-5 md:[&_svg:not([class*='size-'])]:size-4"
                >
                  <IconFlag />
                  Report
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant='destructive'
                  disabled
                  className="px-3 py-2.5 text-base md:px-2 md:py-1.5 md:text-sm [&_svg:not([class*='size-'])]:size-5 md:[&_svg:not([class*='size-'])]:size-4"
                >
                  <IconUserOff />
                  Block
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p>@{username}</p>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Popup className='fixed top-1/2 left-1/2 z-120 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-[min(var(--radius-4xl),24px)] bg-popover p-6 text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'>
            <div className='flex flex-col gap-5'>
              <div className='flex flex-col gap-1'>
                <DialogPrimitive.Title className='font-heading text-base font-medium'>
                  Report @{username}?
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className='text-sm text-muted-foreground'>
                  Describe why you are reporting this account.
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
