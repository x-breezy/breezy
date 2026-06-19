"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Dialog, DialogContent, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { SettingsHeader } from "./settings-header"
import SettingsScreen from "./settings-screen"

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Popup className='fixed inset-0 z-120 flex flex-col bg-background outline-none'>
            <SettingsHeader onClose={onClose} />
            <SettingsScreen />
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
        <SettingsHeader onClose={onClose} />
        <div className='overflow-y-auto'>
          <SettingsScreen />
        </div>
      </DialogContent>
    </Dialog>
  )
}
