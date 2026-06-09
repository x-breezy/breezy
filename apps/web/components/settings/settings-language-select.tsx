"use client"

import { IconLanguage } from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SettingsLanguageSelectProps {
  value: string | null
  onChange: (value: string | null) => void
}

const languages = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
]

export function SettingsLanguageSelect({ value, onChange }: SettingsLanguageSelectProps) {
  return (
    <Select value={value ?? undefined} onValueChange={(val) => onChange(val ?? null)}>
      <SelectTrigger className='flex h-auto w-full items-center justify-between rounded-3xl border-none bg-muted px-3 py-1 text-left font-normal text-foreground shadow-none transition focus:ring-0 focus:ring-offset-0 active:bg-accent/50 data-[state=open]:bg-accent/50'>
        <div className='flex items-center gap-3'>
          <IconLanguage className='h-5 w-5 flex-shrink-0 text-muted-foreground' strokeWidth={2} />
          <span className='text-sm font-medium text-foreground'>Language</span>
        </div>
        <div className='mr-1 font-sans text-xs text-muted-foreground'>
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className='rounded-2xl border-border shadow-lg' alignItemWithTrigger={false}>
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
