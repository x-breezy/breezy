"use client"

interface SettingsLogoutButtonProps {
  onLogout: () => void
}

export function SettingsLogoutButton({ onLogout }: SettingsLogoutButtonProps) {
  return (
    <button
      onClick={onLogout}
      className='mt-1 w-full rounded-2xl border border-border bg-background py-2.5 text-center text-sm font-medium text-red-500 transition active:bg-red-50/50'
    >
      Log out
    </button>
  )
}
