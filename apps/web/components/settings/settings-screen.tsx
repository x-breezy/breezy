"use client"

import { useState } from "react"
import {
  SettingsLanguageSelect,
  SettingsThemeSelect,
  SettingsLogoutButton,
  SettingsTwoFactor,
} from "."
import { logoutAction } from "@/app/(app)/settings/actions"
import { SettingsEmailVerification } from "./settings-email-verification"

export default function SettingsScreen() {
  const [language, setLanguage] = useState<string | null>("fr")

  async function handleLogout() {
    await logoutAction()
  }

  return (
    <div className='container-center flex w-full flex-col bg-background p-4 font-sans select-none'>
      <div className='mt-2 flex w-full flex-col gap-3.5'>
        <SettingsLanguageSelect value={language} onChange={setLanguage} />

        <SettingsThemeSelect />

        <SettingsTwoFactor />
        <SettingsEmailVerification />

        <SettingsLogoutButton onLogout={handleLogout} />
      </div>
    </div>
  )
}
