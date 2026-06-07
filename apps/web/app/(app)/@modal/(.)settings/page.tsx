"use client"

import { useRouter } from "next/navigation"
import { SettingsDialog } from "@/components/settings"

export default function SettingsModal() {
  const router = useRouter()
  return <SettingsDialog onDismiss={() => router.back()} />
}
