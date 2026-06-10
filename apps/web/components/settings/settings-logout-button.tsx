"use client"

import { Button } from "../ui/button"

interface SettingsLogoutButtonProps {
  onLogout: () => void
}

export function SettingsLogoutButton({ onLogout }: SettingsLogoutButtonProps) {
  return (
    <Button size='lg' variant='destructive' onClick={onLogout}>
      Log out
    </Button>
  )
}
