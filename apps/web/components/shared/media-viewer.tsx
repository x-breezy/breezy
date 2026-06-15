"use client"

import { useEffect, useCallback } from "react"
import Image from "next/image"
import { IconX, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import type { SearchPostMedia } from "@/lib/actions/posts"
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog"

interface MediaViewerProps {
  items: SearchPostMedia[]
  open: boolean
  index: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export function MediaViewer({ items, open, index, onClose, onNavigate }: MediaViewerProps) {
  const item = items[index]

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1)
      if (e.key === "ArrowRight" && index < items.length - 1) onNavigate(index + 1)
    },
    [open, onNavigate, index, items.length]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogPortal>
        <DialogOverlay className='bg-black/90' />
        <DialogPrimitive.Popup className='fixed inset-0 z-120 flex items-center justify-center outline-none'>
          <DialogPrimitive.Close
            aria-label='Close'
            className='absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70'
          >
            <IconX size={20} />
          </DialogPrimitive.Close>

          {index > 0 && (
            <button
              aria-label='Previous'
              className='absolute left-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70'
              onClick={() => onNavigate(index - 1)}
            >
              <IconChevronLeft size={20} />
            </button>
          )}

          {item && (
            <div className='max-h-[90vh] max-w-[90vw]'>
              {item.type === "image" ? (
                <Image
                  src={`/api/media/images/${item.id}`}
                  alt=''
                  width={1200}
                  height={900}
                  unoptimized
                  className='max-h-[90vh] max-w-[90vw] object-contain'
                />
              ) : (
                <video
                  src={`/api/media/videos/${item.id}`}
                  className='max-h-[90vh] max-w-[90vw]'
                  controls
                  autoPlay
                />
              )}
            </div>
          )}

          {index < items.length - 1 && (
            <button
              aria-label='Next'
              className='absolute right-4 rounded-full bg-black/50 p-2 text-white hover:bg-black/70'
              onClick={() => onNavigate(index + 1)}
            >
              <IconChevronRight size={20} />
            </button>
          )}

          {items.length > 1 && (
            <div className='absolute bottom-4 flex gap-2'>
              {items.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPortal>
    </DialogPrimitive.Root>
  )
}
