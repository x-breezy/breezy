"use client"

import { useSyncExternalStore } from "react"
import { createPortal } from "react-dom"

const subscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

interface PortalProps {
  children: React.ReactNode
  container?: HTMLElement | null
}

export function Portal({ children, container }: PortalProps) {
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  if (!mounted) return null

  const target = container ?? document.body
  return createPortal(children, target)
}
