"use client"

import React, { useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { IconUserX } from "@tabler/icons-react"

interface UnfollowDialogProps {
  username: string
  onConfirm: () => void
  trigger: React.ReactElement<{ onClick?: React.MouseEventHandler }>
}

export function UnfollowDialog({ username, onConfirm, trigger }: UnfollowDialogProps) {
  const [open, setOpen] = useState(false)

  function handleTriggerClick(e: React.MouseEvent) {
    e.stopPropagation()
    setOpen(true)
  }

  function handleConfirm(e: React.MouseEvent) {
    e.stopPropagation()
    setOpen(false)
    onConfirm()
  }

  return (
    <>
      {React.cloneElement(trigger, { onClick: handleTriggerClick })}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay onClick={(e) => e.stopPropagation()} />
          <DialogPrimitive.Popup
            onClick={(e) => e.stopPropagation()}
            className='fixed top-1/2 left-1/2 z-120 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-[min(var(--radius-4xl),24px)] bg-popover p-6 text-popover-foreground shadow-xl ring-1 ring-foreground/5 duration-100 outline-none dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95'
          >
            <div className='flex flex-col gap-5'>
              <div className='flex flex-col gap-1'>
                <DialogPrimitive.Title className='font-heading text-base font-medium'>
                  Unfollow @{username}?
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className='text-sm text-muted-foreground'>
                  Their posts won't appear in your feed anymore.
                </DialogPrimitive.Description>
              </div>
              <div className='flex justify-center gap-2'>
                <DialogPrimitive.Close
                  render={
                    <Button
                      size='lg'
                      className='w-1/2'
                      variant='secondary'
                      onClick={(e) => e.stopPropagation()}
                    />
                  }
                >
                  Cancel
                </DialogPrimitive.Close>
                <Button variant='destructive' className='w-1/2' size='lg' onClick={handleConfirm}>
                  <IconUserX />
                  Unfollow
                </Button>
              </div>
            </div>
          </DialogPrimitive.Popup>
        </DialogPortal>
      </Dialog>
    </>
  )
}
