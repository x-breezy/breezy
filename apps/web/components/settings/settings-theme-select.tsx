"use client"

import { useTheme } from "next-themes"
import { IconPalette } from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@breezy/ui/components/select"

const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
]

export function SettingsThemeSelect() {
  const { theme, setTheme } = useTheme()

  return (
    <Select value={theme} onValueChange={(val) => val && setTheme(val)}>
      <SelectTrigger className='flex h-auto w-full items-center justify-between rounded-3xl border-none bg-muted px-3 py-1 text-left font-normal text-foreground shadow-none transition focus:ring-0 focus:ring-offset-0 active:bg-accent/50 data-[state=open]:bg-accent/50'>
        <div className='flex items-center gap-3'>
          <IconPalette className='h-5 w-5 flex-shrink-0 text-muted-foreground' strokeWidth={2} />
          <span className='text-sm font-medium text-foreground'>Theme</span>
        </div>
        <div className='mr-1 font-sans text-xs text-muted-foreground capitalize'>
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className='rounded-2xl border-border shadow-lg'>
        <SelectGroup>
          {themes.map((option) => (
            <SelectItem key={option.value} value={option.value} className='rounded-xl text-sm'>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
