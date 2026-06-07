"use client"

import { useState } from "react"
import { Dialog, DialogOverlay, DialogPortal } from "@breezy/ui/components/dialog"
import { useIsMobile } from "@/hooks/use-is-mobile"
import { SettingsHeader } from "./settings-header"
import SettingsScreen from "@/components/SettingsScreen"

interface SettingsDialogProps {
  onDismiss: () => void
}

export function SettingsDialog({ onDismiss }: SettingsDialogProps) {
  const [open, setOpen] = useState(true)
  const isMobile = useIsMobile()

  function handleClose() {
    if (isMobile) {
      onDismiss()
    } else {
      setOpen(false)
      setTimeout(onDismiss, 100)
    }
  }

  // Mobile: full page overlay
  if (isMobile) {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogPortal>
          <DialogOverlay />
          <div className='fixed inset-0 z-120 flex flex-col bg-background'>
            <SettingsHeader />
            <SettingsScreen name='Grod' username='grod_le_goat' />
          </div>
        </DialogPortal>
      </Dialog>
    )
  }

  // Desktop: anchored to top-right, position never shifts
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogPortal>
        <DialogOverlay />
        <div className='fixed top-4 right-4 z-120 flex max-h-[calc(100vh-2rem)] w-80 flex-col overflow-hidden rounded-[min(var(--radius-4xl),24px)] bg-popover shadow-xl ring-1 ring-foreground/5 dark:ring-foreground/10'>
          <SettingsHeader onClose={handleClose} />
          <div className='overflow-y-auto'>
            <SettingsScreen name='Grod' username='grod_le_goat' />
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  )
}
