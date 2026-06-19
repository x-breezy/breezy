"use client"

import { cn } from "@/lib/utils"
import { ProfileEditDialog } from "./edit/profile-edit-dialog"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { Button } from "../ui/button"
import {
  IconLoader2,
  IconSend,
  IconPencilFilled,
  IconUserPlus,
  IconUserX,
  IconDots,
  IconFlag,
  IconUserOff,
} from "@tabler/icons-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { Profile } from "@/types/profile"
import { useProfileStore } from "@/stores/profile-store"
import { useUserStore } from "@/stores/user-store"
import { UnfollowDialog } from "../shared/unfollow-dialog"
import { reportProfile } from "@/lib/actions/reports"
import { suspendUser } from "@/lib/actions/users"

interface ProfileActionsProps {
  className?: string
  profile?: Profile
  isOwn?: boolean
}

export function ProfileActions({ className, profile, isOwn }: ProfileActionsProps) {
  const t = useTranslations("profilePage")
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [suspendOpen, setSuspendOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [modPending, setModPending] = useState(false)
  const profileFollow = useProfileStore((s) => s.follow)
  const profileUnfollow = useProfileStore((s) => s.unfollow)
  const following = useUserStore((s) => s.following)
  const setRelation = useUserStore((s) => s.setRelation)
  const currentUserRole = useUserStore((s) => s.user?.role)
  const isModerator = currentUserRole === "moderator" || currentUserRole === "admin"

  const followed = profile ? (following[profile.profileId] ?? false) : false

  const handleFollow = async () => {
    if (!profile || pending) return
    setPending(true)
    try {
      if (followed) {
        await profileUnfollow(profile.profileId, profile.username)
        setRelation(profile.profileId, false)
      } else {
        await profileFollow(profile.profileId, profile.username)
        setRelation(profile.profileId, true)
      }
    } finally {
      setPending(false)
    }
  }

  const handleMessage = () => {}

  async function handleReport() {
    if (!profile || !reason.trim()) return
    setModPending(true)
    try {
      await reportProfile(profile.profileId, reason)
      setReportOpen(false)
      setReason("")
    } finally {
      setModPending(false)
    }
  }

  async function handleSuspend() {
    if (!profile) return
    setModPending(true)
    try {
      await suspendUser(profile.profileId)
      setSuspendOpen(false)
    } finally {
      setModPending(false)
    }
  }

  if (!profile) return null

  return (
    <div className={cn(className, "inline-flex w-full gap-3")}>
      {profile && (
        <ProfileEditDialog open={open} onClose={() => setOpen(false)} profile={profile} />
      )}

      {isOwn && (
        <Button
          variant='secondary'
          className='w-full max-w-40'
          size='lg'
          onClick={() => setOpen(true)}
        >
          {t("editProfile")}
          <IconPencilFilled />
        </Button>
      )}
      {!isOwn && (
        <>
          {followed && (
            <UnfollowDialog
              username={profile.username}
              onConfirm={handleFollow}
              trigger={
                <Button
                  className='w-full max-w-40 font-semibold'
                  size='lg'
                  variant='secondary'
                  disabled={pending}
                >
                  {pending ? (
                    <IconLoader2 className='animate-spin' stroke={2.3} />
                  ) : (
                    <>
                      <IconUserX stroke={2.3} /> {t("buttonFollowing")}
                    </>
                  )}
                </Button>
              }
            />
          )}
          {!followed && (
            <Button
              variant='default'
              className='w-full max-w-40 font-semibold'
              size='lg'
              disabled={pending}
              onClick={handleFollow}
            >
              <IconUserPlus stroke={2.3} /> {t("buttonFollow")}
            </Button>
          )}
          <Button
            variant='secondary'
            className='w-full max-w-40 font-semibold'
            size='lg'
            onClick={handleMessage}
          >
            <IconSend stroke={2.3} />
            {t("buttonMessage")}
          </Button>

          {/* Moderation menu — only for moderators/admins */}
          {isModerator && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label='Moderation actions'
                    className='text-muted-foreground'
                  >
                    <IconDots />
                  </Button>
                }
              />
              <DropdownMenuContent align='end'>
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => setReportOpen(true)}
                  className='px-3 py-2.5 text-base md:px-2 md:py-1.5 md:text-sm'
                >
                  <IconFlag />
                  Report
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => setSuspendOpen(true)}
                  className='px-3 py-2.5 text-base md:px-2 md:py-1.5 md:text-sm'
                >
                  <IconUserOff />
                  Suspend
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      )}

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Popup className='fixed top-1/2 left-1/2 z-120 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-[min(var(--radius-4xl),24px)] bg-popover p-6 text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'>
            <div className='flex flex-col gap-5'>
              <div className='flex flex-col gap-1'>
                <DialogPrimitive.Title className='font-heading text-base font-medium'>
                  Report this user?
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className='text-sm text-muted-foreground'>
                  Describe why you are reporting @{profile.username}.
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
                  disabled={!reason.trim() || modPending}
                >
                  <IconFlag />
                  Report
                </Button>
              </div>
            </div>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>

      {/* Suspend dialog */}
      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Popup className='fixed top-1/2 left-1/2 z-120 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-[min(var(--radius-4xl),24px)] bg-popover p-6 text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'>
            <div className='flex flex-col gap-5'>
              <div className='flex flex-col gap-1'>
                <DialogPrimitive.Title className='font-heading text-base font-medium'>
                  Suspend @{profile.username}?
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className='text-sm text-muted-foreground'>
                  This user will be temporarily suspended and lose access to their account.
                </DialogPrimitive.Description>
              </div>
              <div className='flex justify-center gap-2'>
                <DialogPrimitive.Close
                  render={<Button size='lg' className='w-1/2' variant='secondary' />}
                >
                  Cancel
                </DialogPrimitive.Close>
                <Button
                  variant='destructive'
                  className='w-1/2'
                  size='lg'
                  onClick={handleSuspend}
                  disabled={modPending}
                >
                  <IconUserOff />
                  Suspend
                </Button>
              </div>
            </div>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    </div>
  )
}
