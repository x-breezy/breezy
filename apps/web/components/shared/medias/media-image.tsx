"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface MediaImageProps {
  src: string
  onClick: () => void
  cover?: boolean
  className?: string
}

export function MediaImage({ src, onClick, cover = false, className }: MediaImageProps) {
  const [loaded, setLoaded] = useState(false)
  return (
    <div
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-lg border",
        cover ? "aspect-square" : !loaded && "aspect-video",
        className
      )}
      style={cover ? undefined : { maxWidth: "300px" }}
      onClick={onClick}
    >
      {!loaded && <Skeleton className='absolute inset-0 h-full w-full rounded-lg' />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=''
        loading='lazy'
        className={cn(
          "transition-opacity duration-200",
          cover ? "h-full w-full object-cover" : "w-full",
          loaded ? "opacity-100" : "opacity-0"
        )}
        style={cover ? undefined : { height: "auto" }}
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}
