"use client"

import * as React from "react"
import { useEffect } from "react"
import { useTheme, ThemeProvider as NextThemesProvider } from "next-themes"
import type { Theme } from "@/lib/theme"
import { setThemeCookie } from "@/lib/theme"

function ThemeSync() {
  const { theme, resolvedTheme } = useTheme()

  useEffect(() => {
    if (theme) {
      setThemeCookie(theme as Theme)
    }
  }, [theme, resolvedTheme])

  return null
}

interface ThemeProviderProps extends React.ComponentProps<typeof NextThemesProvider> {
  defaultTheme?: Theme
}

function ThemeProvider({ children, defaultTheme = "system", ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute='class'
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
