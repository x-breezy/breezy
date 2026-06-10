"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { isAxiosError } from "axios"
import { clearSessionCookies, getServerAuthHeader, REFRESH_COOKIE } from "@/lib/auth/session"
import {
  logout,
  sendTwoFactorCode,
  enableTwoFactor,
  disableTwoFactor,
} from "@/lib/services/auth-service"

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
    await sendTwoFactorCode(await getServerAuthHeader())
  } catch (err) {
    if (isAxiosError(err)) {
      const d = err.response?.data as { message?: string; code?: string }
      return {
        error: d?.message ?? "Failed to send code.",
        code: d?.code,
        retryAfter: err.response?.status === 429 ? 60 : undefined,
      }
    }
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
    await enableTwoFactor(code, await getServerAuthHeader())
  } catch (err) {
    if (isAxiosError(err)) return { error: err.response?.data?.message ?? "Invalid code." }
    return { error: "Could not reach the server." }
  }
  redirect("/settings")
}

export async function twoFactorDisableAction(): Promise<ActionState> {
  try {
    await disableTwoFactor(await getServerAuthHeader())
  } catch (err) {
    if (isAxiosError(err)) return { error: err.response?.data?.message ?? "Failed to disable 2FA." }
    return { error: "Could not reach the server." }
  }
  redirect("/settings")
}
