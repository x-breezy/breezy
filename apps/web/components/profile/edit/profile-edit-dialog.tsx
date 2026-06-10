"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { ProfileEditHeader } from "./profile-edit-header"
import ProfileEditScreen from "./profile-edit"
import type { Profile } from "@/types/profile"

interface ProfileEditDialogProps {
  open: boolean
  onClose: () => void
  profile: Profile
}

export function ProfileEditDialog({ open, onClose, profile }: ProfileEditDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Popup className='fixed inset-0 z-120 flex flex-col bg-background outline-none'>
            <ProfileEditHeader onClose={onClose} profile={profile} />
            <ProfileEditScreen profile={profile} onClose={onClose} />
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className='z-120 flex max-h-[80vh] flex-col gap-0 overflow-hidden p-0 sm:top-4 sm:max-w-lg sm:rounded-[min(var(--radius-4xl),24px)]'
      >
        <ProfileEditHeader onClose={onClose} profile={profile} />
        <div className='overflow-y-auto'>
          <ProfileEditScreen profile={profile} onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
