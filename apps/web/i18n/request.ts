import { getRequestConfig } from "next-intl/server"
import { cookies } from "next/headers"

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = cookieStore.get("breezy-language")?.value || "fr"

  return {
    locale,
    messages: (await import(`../dictionaries/${locale}.json`)).default,
  }
})
