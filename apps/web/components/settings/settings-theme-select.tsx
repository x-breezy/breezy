"use client"

import { useTheme } from "next-themes"
import { IconPaintFilled } from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const themes = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
]

export function SettingsThemeSelect() {
  const { theme, setTheme } = useTheme()

  return (
    <Select value={theme} onValueChange={(val) => val && setTheme(val)}>
      <SelectTrigger className='min-h-9 w-full px-3'>
        <div className='flex w-3/4 items-center gap-2'>
          <IconPaintFilled className='shrink-0 text-muted-foreground' />
          <span className='text-sm font-medium text-foreground'>Theme</span>
        </div>
        <div className='w-1/4 capitalize'>
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        <SelectGroup>
          {themes.map((option) => (
            <SelectItem key={option.value} value={option.value} className='text-sm'>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
