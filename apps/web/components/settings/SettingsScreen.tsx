"use client"

import { useState } from "react"
import {
  SettingsUserCard,
  SettingsLanguageSelect,
  SettingsThemeSelect,
  SettingsLogoutButton,
} from "."

interface SettingsScreenProps {
  name: string
  username: string
  avatarUrl?: string
}

export default function SettingsScreen({ name, username, avatarUrl }: SettingsScreenProps) {
  const [language, setLanguage] = useState<string | null>("fr")

  function handleLogout() {
    alert("Déconnexion de l'utilisateur")
  }

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col bg-background p-4 font-sans select-none'>
      <div className='mt-2 flex w-full flex-col gap-3.5'>
        <SettingsUserCard
          name={name}
          username={username}
          avatarUrl={avatarUrl}
          onClick={() => console.log("Navigate to profile edit")}
        />

        <SettingsLanguageSelect value={language} onChange={setLanguage} />

        <SettingsThemeSelect />

        <SettingsLogoutButton onLogout={handleLogout} />
      </div>
    </div>
  )
}
