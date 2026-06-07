"use client"

export type Theme = "light" | "dark" | "system"

const THEME_COOKIE = "breezy-theme"

export function getThemeCookie(): Theme {
  if (typeof document === "undefined") return "system"
  const match = document.cookie.match(new RegExp(`(^| )${THEME_COOKIE}=([^;]+)`))
  return (match?.[2] as Theme) ?? "system"
}

export function setThemeCookie(theme: Theme) {
  document.cookie = `${THEME_COOKIE}=${theme};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
}
