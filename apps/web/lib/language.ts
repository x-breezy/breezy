"use client"

export type Language = "en" | "fr" | "es"

const LANGUAGE_COOKIE = "breezy-language"

export function setLanguageCookie(language: Language) {
  document.cookie = `${LANGUAGE_COOKIE}=${language};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
}
