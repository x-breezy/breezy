import type { ComponentType } from "react"

export interface NavItemData {
  href: string
  icon: ComponentType<{ active?: boolean; className?: string }>
  label: string
}

export interface NavItemProps extends NavItemData {
  isActive: boolean
  showLabel?: boolean
  iconClassName?: string
}
