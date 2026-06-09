"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getAuthActionError } from "@/lib/auth/api-error"
import { clearSessionCookies, getServerAuthHeader, REFRESH_COOKIE } from "@/lib/auth/session"
import { logout, sendTwoFactorCode, enableTwoFactor, disableTwoFactor } from "@/lib/services/auth-service"

export async function logoutAction() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
  if (refreshToken) {
    try {
      await logout(refreshToken)
    } catch {
      // Best-effort revocation; clear cookies regardless.
    }
  }
  await clearSessionCookies()
  redirect("/sign-in")
}

interface ActionState {
  error: string | null
  sent?: boolean
  code?: string
  retryAfter?: number
}

export async function twoFactorSendCodeAction(): Promise<ActionState> {
  try {
    const res = await sendTwoFactorCode(await getServerAuthHeader())
    if (!res.ok) return await getAuthActionError(res, "Failed to send code.")
  } catch {
    return { error: "Could not reach the server." }
  }
  return { error: null, sent: true }
}

export async function twoFactorEnableAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const code = formData.get("code") as string
  try {
    const res = await enableTwoFactor(code, await getServerAuthHeader())
    if (!res.ok) return await getAuthActionError(res, "Invalid code.")
  } catch {
    return { error: "Could not reach the server." }
  }
  redirect("/settings")
}

export async function twoFactorDisableAction(): Promise<ActionState> {
  try {
    const res = await disableTwoFactor(await getServerAuthHeader())
    if (!res.ok) return await getAuthActionError(res, "Failed to disable 2FA.")
  } catch {
    return { error: "Could not reach the server." }
  }
  redirect("/settings")
}
