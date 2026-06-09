"use server"

import { redirect } from "next/navigation"
import { getAuthActionError } from "@/lib/auth/api-error"
import { setSessionCookies } from "@/lib/auth/session"
import { signIn } from "@/lib/services/auth-service"

interface ActionState {
  error: string | null
  code?: string
  retryAfter?: number
}

export async function signInAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const identifier = formData.get("identifier") as string
  const password = formData.get("password") as string

  let accessToken: string | undefined
  let refreshToken: string | undefined
  let twoFactorPath: string | undefined

  try {
    const res = await signIn(identifier, password)
    if (!res.ok) return await getAuthActionError(res, "Something went wrong.")

    const body = await res.json()
    if (body.requiresTwoFactor) {
      const pendingToken = body.data?.pendingToken as string | undefined
      if (!pendingToken) return { error: "Two-factor verification could not be started." }
      twoFactorPath = `/two-factor?t=${encodeURIComponent(pendingToken)}`
    } else {
      accessToken = body.data?.token
      refreshToken = body.data?.refreshToken
    }
  } catch {
    return { error: "Could not reach the server." }
  }

  if (twoFactorPath) redirect(twoFactorPath)

  if (!accessToken || !refreshToken) {
    return { error: "Authentication response was incomplete." }
  }

  await setSessionCookies(accessToken, refreshToken)

  redirect("/")
}
