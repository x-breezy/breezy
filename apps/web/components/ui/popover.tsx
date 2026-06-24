"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot='popover' {...props} />
}

function PopoverTrigger({
  className,
  ...props
}: PopoverPrimitive.Trigger.Props & { className?: string }) {
  return <PopoverPrimitive.Trigger data-slot='popover-trigger' className={className} {...props} />
}

function PopoverPortal({ ...props }: PopoverPrimitive.Portal.Props) {
  return <PopoverPrimitive.Portal data-slot='popover-portal' {...props} />
}

interface PopoverContentProps extends PopoverPrimitive.Popup.Props {
  align?: PopoverPrimitive.Positioner.Props["align"]
  alignOffset?: PopoverPrimitive.Positioner.Props["alignOffset"]
  side?: PopoverPrimitive.Positioner.Props["side"]
  sideOffset?: PopoverPrimitive.Positioner.Props["sideOffset"]
}

function PopoverContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        className='isolate z-50 outline-none'
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <PopoverPrimitive.Popup
          data-slot='popover-content'
          className={cn(
            "z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-2xl bg-popover p-2 text-popover-foreground shadow-lg ring-1 ring-foreground/5 duration-100 outline-none data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:overflow-hidden data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverArrow({ className, ...props }: PopoverPrimitive.Arrow.Props) {
  return (
    <PopoverPrimitive.Arrow
      data-slot='popover-arrow'
      className={cn(
        "data-[side=bottom]:rotate-180 data-[side=left]:-rotate-90 data-[side=right]:rotate-90",
        className
      )}
      {...props}
    >
      <svg width='20' height='10' viewBox='0 0 20 10' fill='none' className='fill-popover'>
        <path d='M10 0L20 10H0L10 0Z' />
      </svg>
    </PopoverPrimitive.Arrow>
  )
}

export { Popover, PopoverTrigger, PopoverPortal, PopoverContent, PopoverArrow }
