"use client"

import { useState } from "react"
import {
  SettingsLanguageSelect,
  SettingsThemeSelect,
  SettingsLogoutButton,
  SettingsTwoFactor,
} from "."
import { logoutAction } from "@/app/(app)/settings/actions"

interface SettingsScreenProps {
  twoFactorEnabled?: boolean
}

export default function SettingsScreen({ twoFactorEnabled = false }: SettingsScreenProps) {
  const [language, setLanguage] = useState<string | null>("fr")

  async function handleLogout() {
    await logoutAction()
  }

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col bg-background p-4 font-sans select-none'>
      <div className='mt-2 flex w-full flex-col gap-3.5'>
        <SettingsLanguageSelect value={language} onChange={setLanguage} />

        <SettingsThemeSelect />

        <SettingsTwoFactor enabled={twoFactorEnabled} />

        <SettingsLogoutButton onLogout={handleLogout} />
      </div>
    </div>
  )
}
