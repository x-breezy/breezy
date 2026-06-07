"use client"

import { SettingsHeader } from "@/components/settings"
import SettingsScreen from "@/components/SettingsScreen"

export default function SettingsPage() {
  return (
    // Hidden on desktop - modal handles desktop view
    <div className='min-h-svh bg-background sm:hidden'>
      <SettingsHeader />
      <SettingsScreen name='Grod' username='grod_le_goat' />
    </div>
  )
}
