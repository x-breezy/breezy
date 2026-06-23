"use client"

import React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup className='fixed top-1/2 left-1/2 z-120 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-[min(var(--radius-4xl),24px)] bg-popover p-6 text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'>
          <div className='flex flex-col gap-5'>
            <div className='flex flex-col gap-1'>
              <DialogPrimitive.Title className='font-heading text-base font-medium'>
                {title}
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className='text-sm text-muted-foreground'>
                {description}
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
                onClick={() => {
                  onOpenChange(false)
                  onConfirm()
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  )
}
