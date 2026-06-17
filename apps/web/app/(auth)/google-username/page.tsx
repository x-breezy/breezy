import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { GoogleUsernameForm } from "./form"

export const metadata: Metadata = {
  title: "Choose Username",
  description: "Pick your Breezy username to complete sign up.",
}

export default async function GoogleUsernamePage() {
  const cookieStore = await cookies()
  const pendingToken = cookieStore.get("pending_google_token")?.value

  if (!pendingToken) redirect("/sign-up")

  const displayName = (() => {
    try {
      const part = pendingToken.split(".")[1]
      if (!part) return undefined
      const payload = JSON.parse(Buffer.from(part, "base64url").toString()) as {
        firstName?: string
        lastName?: string
      }
      return [payload.firstName, payload.lastName].filter(Boolean).join(" ") || undefined
    } catch {
      return undefined
    }
  })()

  return <GoogleUsernameForm pendingToken={pendingToken} displayName={displayName} />
}
