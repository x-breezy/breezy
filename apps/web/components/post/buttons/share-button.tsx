import { IconShare3 } from "@tabler/icons-react"

interface ShareButtonProps {
  onShare: (e: React.MouseEvent) => void
  size?: "sm" | "md"
}

const sizeConfig = { sm: 18, md: 22 }

export function ShareButton({ onShare, size = "sm" }: ShareButtonProps) {
  const iconSize = sizeConfig[size]
  return (
    <button
      aria-label='Share post'
      className={`flex items-center gap-1 ${size === "md" ? "text-sm" : "text-xs"} rounded-full p-1 px-2 text-muted-foreground transition select-none hover:bg-secondary hover:text-secondary-foreground active:text-foreground`}
      onClick={onShare}
    >
      <IconShare3 size={iconSize} stroke={2} className='shrink-0' aria-hidden='true' />
    </button>
  )
}
