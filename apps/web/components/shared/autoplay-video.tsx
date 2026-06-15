"use client"

import { useRef, useEffect } from "react"

export function AutoplayVideo({
  src,
  className,
  onClick,
}: {
  src: string
  className?: string
  onClick?: () => void
}) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.5 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      controls
      preload='metadata'
      className={className}
      onClick={onClick}
    />
  )
}
