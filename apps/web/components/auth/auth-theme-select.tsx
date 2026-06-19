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

export function AuthThemeSelect() {
  const { theme, setTheme } = useTheme()
  const t = useTranslations("settings")

  const themes = [
    { value: "light", label: t("themeLight") },
    { value: "dark", label: t("themeDark") },
    { value: "system", label: t("themeSystem") },
  ]

  return (
    <div className='mt-8 flex justify-center'>
      <Select value={theme} onValueChange={(val) => val && setTheme(val)}>
        <SelectTrigger
          suppressHydrationWarning
          className='h-8 w-[120px] rounded-full border-0 bg-transparent px-3 text-xs shadow-none hover:bg-muted/50 focus:ring-0 focus-visible:ring-0'
        >
          <div className='flex items-center gap-1.5 text-muted-foreground transition-colors'>
            <IconPaintFilled className='h-3.5 w-3.5 shrink-0' />
            <span suppressHydrationWarning>
              {themes.find((t) => t.value === theme)?.label || "Système"}
            </span>
          </div>
        </SelectTrigger>
        <SelectContent align='center'>
          <SelectGroup>
            {themes.map((option) => (
              <SelectItem key={option.value} value={option.value} className='rounded-xl text-sm'>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
