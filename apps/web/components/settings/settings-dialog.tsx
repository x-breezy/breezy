"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Dialog, DialogOverlay, DialogPortal } from "@breezy/ui/components/dialog"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { SettingsHeader } from "./settings-header"
import SettingsScreen from "@/components/SettingsScreen"

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const isMobile = useIsMobile()

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPortal>
        <DialogOverlay />
        {isMobile ? (
          <DialogPrimitive.Popup className='fixed inset-0 z-120 flex flex-col bg-background outline-none'>
            <SettingsHeader onClose={onClose} />
            <SettingsScreen name='Grod' username='grod_le_goat' />
          </DialogPrimitive.Popup>
        ) : (
          <div className='fixed inset-x-0 top-4 z-120 flex justify-center'>
            <DialogPrimitive.Popup className='flex h-fit w-full max-w-sm flex-col overflow-hidden rounded-[min(var(--radius-4xl),24px)] bg-popover shadow-xl ring-1 ring-foreground/5 outline-none dark:ring-foreground/10'>
              <SettingsHeader onClose={onClose} />
              <div className='overflow-y-auto'>
                <SettingsScreen name='Grod' username='grod_le_goat' />
              </div>
            </DialogPrimitive.Popup>
          </div>
        )}
      </DialogPortal>
    </Dialog>
  )
}
