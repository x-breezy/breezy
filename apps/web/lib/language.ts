export type Language = "en" | "fr" | "es"

export const defaultLanguage: Language = "en"

const LANGUAGE_COOKIE = "breezy-language"

export function setLanguageCookie(language: Language) {
  document.cookie = `${LANGUAGE_COOKIE}=${language};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
}
