"use client"

import { useRouter } from "next/navigation"
import { setLanguageCookie, type Language } from "@/lib/language"
import { useLocale } from "next-intl"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const languages: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
]

export function FooterLanguageSelect() {
  const router = useRouter()
  const currentLocale = useLocale()

  function handleLanguageChange(val: string) {
    if (val === currentLocale) return
    setLanguageCookie(val as Language)
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:text-foreground hover:underline text-xs text-muted-foreground outline-none">
        {languages.find((l) => l.value === currentLocale)?.label || "English"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-32">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.value}
            onClick={() => handleLanguageChange(lang.value)}
            className="cursor-pointer"
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
