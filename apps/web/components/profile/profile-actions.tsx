"use client"

import { Button } from "@breezy/ui/components/button"
import { cn } from "@breezy/ui/lib/utils"
import { IconPencil } from "@tabler/icons-react"

interface ProfileEditButtonProps {
  onClick?: () => void
  className?: string
}

export function ProfileEditButton({ onClick, className }: ProfileEditButtonProps) {
  return (
    <Button variant='secondary' className={cn(className)} onClick={onClick}>
      <span>Edit Profile</span>
      <IconPencil className='size-4' strokeWidth={2} />
    </Button>
  )
}

interface ProfileActionsProps {
  onEdit?: () => void
  className?: string
}

export function ProfileActions({ onEdit, className }: ProfileActionsProps) {
  return (
    <div className={cn("flex justify-center", className)}>
      <ProfileEditButton onClick={onEdit} />
    </div>
  )
}
