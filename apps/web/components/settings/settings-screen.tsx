"use client"

import { useLocale } from "next-intl"
import {
  SettingsLanguageSelect,
  SettingsThemeSelect,
  SettingsLogoutButton,
  SettingsTwoFactor,
} from "."
import { logoutAction } from "@/lib/actions/settings"
import { SettingsEmailVerification } from "./settings-email-verification"
import type { Language } from "@/lib/language"

export default function SettingsScreen() {
  const locale = useLocale() as Language

  async function handleLogout() {
    await logoutAction()
  }

  return (
    <div className='container-center flex w-full flex-col bg-background p-4 font-sans select-none'>
      <div className='mt-2 flex w-full flex-col gap-3.5'>
        <SettingsLanguageSelect value={locale} />

        <SettingsThemeSelect />

        <SettingsTwoFactor />
        <SettingsEmailVerification />

        <SettingsLogoutButton onLogout={handleLogout} />
      </div>
    </div>
  )
}
