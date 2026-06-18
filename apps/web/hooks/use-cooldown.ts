"use client"

import { useEffect, useState } from "react"

export function useCooldown(seconds?: number, resetKey?: unknown): number {
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemaining(seconds && seconds > 0 ? seconds : 0)
  }, [seconds, resetKey])

  useEffect(() => {
    if (remaining <= 0) return

    const timeout = window.setTimeout(() => {
      setRemaining((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearTimeout(timeout)
  }, [remaining])

  return remaining
}
