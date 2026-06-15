"use client"

import { useRouter } from "next/navigation"
import { setLanguageCookie, type Language } from "@/lib/language"
import { useLocale } from "next-intl"
import { IconWorldFilled } from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const languages: { value: Language; label: string }[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
]

export function AuthLanguageSelect() {
  const router = useRouter()
  const currentLocale = useLocale()

  function handleLanguageChange(val: string) {
    if (val === currentLocale) return
    setLanguageCookie(val as Language)
    router.refresh()
  }

  return (
    <div className='mt-8 flex justify-center'>
      <Select value={currentLocale} onValueChange={handleLanguageChange}>
        <SelectTrigger className='h-8 w-[120px] rounded-full border-0 bg-transparent px-3 text-xs shadow-none hover:bg-muted/50 focus:ring-0 focus-visible:ring-0'>
          <div className='flex items-center gap-1.5 text-muted-foreground transition-colors'>
            <IconWorldFilled className='h-3.5 w-3.5 shrink-0' />
            <span>{languages.find((l) => l.value === currentLocale)?.label || "English"}</span>
          </div>
        </SelectTrigger>
        <SelectContent align='center'>
          <SelectGroup>
            {languages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value} className='rounded-xl text-sm'>
                {lang.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
