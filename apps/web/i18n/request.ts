import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"
import { ACCESS_COOKIE } from "@/lib/auth/auth-cookies"
import { defaultLanguage, Language } from "@/lib/language"

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const isAuthenticated = !!cookieStore.get(ACCESS_COOKIE)

  const locale: Language = isAuthenticated
    ? (cookieStore.get("breezy-language")?.value as Language) || defaultLanguage
    : defaultLanguage

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
