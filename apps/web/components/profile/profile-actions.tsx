"use client"

import { cn } from "@/lib/utils"
import { ProfileEditDialog } from "./edit/profile-edit-dialog"
import { useState } from "react"
import { Button } from "../ui/button"
import { IconPencilFilled } from "@tabler/icons-react"
import type { Profile } from "@/types/profile"

interface ProfileActionsProps {
  className?: string
  profile?: Profile
}

export function ProfileActions({ className, profile }: ProfileActionsProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className={cn(className, "*: flex w-full justify-center")}>
      {profile && (
        <ProfileEditDialog open={open} onClose={() => setOpen(false)} profile={profile} />
      )}

      <Button variant='outline' className='w-full max-w-40' size='lg' onClick={() => setOpen(true)}>
        Edit Profile
        <IconPencilFilled />
      </Button>
    </div>
  )
}
