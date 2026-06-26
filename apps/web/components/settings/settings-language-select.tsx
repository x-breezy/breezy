"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { IconWorldFilled } from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { setLanguageCookie, type Language } from "@/lib/language"

interface SettingsLanguageSelectProps {
  value: Language
}

const languages: readonly { value: Language; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
]

export function SettingsLanguageSelect({ value }: SettingsLanguageSelectProps) {
  const router = useRouter()
  const t = useTranslations("settings")

  function handleLanguageChange(val: string | null) {
    if (!val) return
    setLanguageCookie(val as Language)
    router.refresh()
  }

  return (
    <Select value={value} onValueChange={handleLanguageChange}>
      <SelectTrigger className='min-h-9 w-full px-3'>
        <div className='flex w-3/4 items-center gap-2'>
          <IconWorldFilled className='h-5 w-5 shrink-0 text-muted-foreground' strokeWidth={2} />
          <span className='text-sm font-medium text-foreground'>{t("language")}</span>
        </div>
        <div className='flex w-1/4 justify-end text-sm text-muted-foreground'>
          <span>{languages.find((l) => l.value === value)?.label || "English"}</span>
        </div>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {languages.map((lang) => (
            <SelectItem key={lang.value} value={lang.value} className='rounded-xl text-sm'>
              {lang.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
