"use client"

import { useTranslations } from "next-intl"
import { Button } from "../ui/button"

interface SettingsLogoutButtonProps {
  onLogout: () => void
}

export function SettingsLogoutButton({ onLogout }: SettingsLogoutButtonProps) {
  const t = useTranslations("settings")
  return (
    <Button size='lg' variant='destructive' onClick={onLogout}>
      {t("logout")}
    </Button>
  )
}
