"use client"

import { useState } from "react"
import {
  SettingsUserCard,
  SettingsLanguageSelect,
  SettingsThemeSelect,
  SettingsLogoutButton,
  SettingsTwoFactor,
} from "."
import { logoutAction } from "@/app/(app)/settings/actions"
import { useUserStore } from "@/stores/user-store"

interface SettingsScreenProps {
  twoFactorEnabled?: boolean
}

export default function SettingsScreen({ twoFactorEnabled = false }: SettingsScreenProps) {
  const [language, setLanguage] = useState<string | null>("fr")
  const profile = useUserStore((s) => s.profile)

  async function handleLogout() {
    await logoutAction()
  }

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col bg-background p-4 font-sans select-none'>
      <div className='mt-2 flex w-full flex-col gap-3.5'>
        <SettingsUserCard
          profile={profile}
          onClick={() => console.log("Navigate to profile edit")}
        />

        <SettingsLanguageSelect value={language} onChange={setLanguage} />

        <SettingsThemeSelect />

        <SettingsTwoFactor enabled={twoFactorEnabled} />

        <SettingsLogoutButton onLogout={handleLogout} />
      </div>
    </div>
  )
}
