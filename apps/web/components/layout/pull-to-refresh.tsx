"use client"

import { useRef, useEffect, useLayoutEffect, useState } from "react"
import { IconRefresh } from "@tabler/icons-react"

const PULL_THRESHOLD = 64

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => void
  children: React.ReactNode
}) {
  const onRefreshRef = useRef(onRefresh)
  useLayoutEffect(() => {
    onRefreshRef.current = onRefresh
  })

  const touchStartY = useRef(-1)
  const pullDistRef = useRef(0)
  const [pullDist, setPullDist] = useState(0)

  useEffect(() => {
    const el = document.querySelector<HTMLElement>("[data-scroll-root]")
    if (!el) return

    const onStart = (e: TouchEvent) => {
      touchStartY.current = el.scrollTop === 0 ? (e.touches[0]?.clientY ?? -1) : -1
    }
    const onMove = (e: TouchEvent) => {
      if (touchStartY.current < 0) return
      const clientY = e.touches[0]?.clientY
      if (clientY == null) return
      const d = Math.min((clientY - touchStartY.current) * 0.5, PULL_THRESHOLD * 1.5)
      if (d > 0) {
        pullDistRef.current = d
        setPullDist(d)
      }
    }
    const onEnd = () => {
      if (pullDistRef.current >= PULL_THRESHOLD) onRefreshRef.current()
      pullDistRef.current = 0
      setPullDist(0)
      touchStartY.current = -1
    }

    el.addEventListener("touchstart", onStart, { passive: true })
    el.addEventListener("touchmove", onMove, { passive: true })
    el.addEventListener("touchend", onEnd)
    return () => {
      el.removeEventListener("touchstart", onStart)
      el.removeEventListener("touchmove", onMove)
      el.removeEventListener("touchend", onEnd)
    }
  }, [])

  return (
    <>
      <div
        className='flex justify-center overflow-hidden'
        style={{ height: pullDist, transition: pullDist === 0 ? "height 0.2s" : "none" }}
      >
        <IconRefresh
          size={20}
          className={pullDist >= PULL_THRESHOLD ? "text-primary" : "text-muted-foreground"}
          style={{
            transform: `rotate(${180 - Math.min(pullDist / PULL_THRESHOLD, 1) * 180}deg)`,
            marginTop: 8,
          }}
        />
      </div>
      {children}
    </>
  )
}
