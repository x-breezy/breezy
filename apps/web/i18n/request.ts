import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"
import { ACCESS_COOKIE } from "@/lib/auth/auth-cookies"

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const isAuthenticated = !!cookieStore.get(ACCESS_COOKIE)
  const locale = isAuthenticated ? cookieStore.get("breezy-language")?.value || "fr" : "fr"

  return {
    locale,
    messages: (await import(`../dictionaries/${locale}.json`)).default,
  }
})
