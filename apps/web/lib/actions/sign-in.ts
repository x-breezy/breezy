"use server"

import { redirect } from "next/navigation"
import { isAxiosError } from "axios"
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
    const { data } = await signIn(identifier, password)
    if (data.requiresTwoFactor) {
      const pendingToken = data.data?.pendingToken as string | undefined
      if (!pendingToken) return { error: "Two-factor verification could not be started." }
      twoFactorPath = `/two-factor?t=${encodeURIComponent(pendingToken)}`
    } else {
      accessToken = data.data?.token
      refreshToken = data.data?.refreshToken
    }
  } catch (err) {
    if (isAxiosError(err)) {
      const data = err.response?.data as Record<string, unknown> | undefined
      return { error: (data?.message ?? data?.error ?? "Something went wrong.") as string }
    }
    return { error: "Could not reach the server." }
  }

  if (twoFactorPath) redirect(twoFactorPath)

  if (!accessToken || !refreshToken) {
    return { error: "Authentication response was incomplete." }
  }

  await setSessionCookies(accessToken, refreshToken)

  redirect("/")
}
