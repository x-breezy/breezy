import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"
import { ACCESS_COOKIE } from "@/lib/auth/auth-cookies"
import { LangEnum } from "@/types/common/lang"

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const isAuthenticated = !!cookieStore.get(ACCESS_COOKIE)

  const locale: LangEnum = isAuthenticated
    ? (cookieStore.get("breezy-language")?.value as LangEnum) || LangEnum.EN
    : LangEnum.EN

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
