import { cn } from "@/lib/utils"

interface PageHeaderProps {
  children: React.ReactNode
  className?: string
}

export function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "container-center sticky top-0 z-100 bg-background/80 px-4 backdrop-blur-sm",
        className
      )}
    >
      {children}
    </header>
  )
}

interface PageHeaderSlotsProps {
  left?: React.ReactNode
  center?: React.ReactNode
  right?: React.ReactNode
}

export function PageHeaderContent({ left, center, right }: PageHeaderSlotsProps) {
  return (
    <div className='flex h-15 items-center justify-between gap-2'>
      <div className='flex items-center gap-2'>{left}</div>
      <div className='flex items-center'>{center}</div>
      <div className='flex items-center gap-1'>{right}</div>
    </div>
  )
}
