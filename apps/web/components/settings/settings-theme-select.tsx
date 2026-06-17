"use client"

import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { IconPaintFilled } from "@tabler/icons-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

export function SettingsThemeSelect() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations("settings")

  const themes = [
    { value: "light", label: t("themeLight") },
    { value: "dark", label: t("themeDark") },
    { value: "system", label: t("themeSystem") },
  ]

  return (
    <Select value={theme} onValueChange={(val) => val && setTheme(val)}>
      <SelectTrigger className='min-h-9 w-full px-3'>
        <div className='flex w-3/4 items-center gap-2'>
          <IconPaintFilled className='shrink-0 text-muted-foreground' />
          <span className='text-sm font-medium text-foreground'>{t("theme")}</span>
        </div>
        <div className='w-1/4 flex justify-end text-sm text-muted-foreground capitalize'>
          <span>{themes.find((t) => t.value === theme)?.label || "System"}</span>
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
