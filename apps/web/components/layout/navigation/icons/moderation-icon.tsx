import { IconShield } from "@tabler/icons-react"

interface ModerationIconProps {
  active?: boolean
  className?: string
}

export function ModerationIcon({ active = false, className }: ModerationIconProps) {
  return <IconShield size={24} strokeWidth={active ? 3 : 2} className={className} />
}
