"use client"

import * as React from "react"
import { useEffect } from "react"
import { useTheme, ThemeProvider as NextThemesProvider } from "next-themes"
import type { Theme } from "@/lib/theme"
import { setThemeCookie, deleteThemeCookie } from "@/lib/theme"

function ThemeSync() {
  const { theme } = useTheme()

  useEffect(() => {
    if (theme === "system") {
      deleteThemeCookie()
    } else if (theme) {
      setThemeCookie(theme as Theme)
    }
  }, [theme])

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
      scriptProps={{ suppressHydrationWarning: true }}
      {...props}
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
