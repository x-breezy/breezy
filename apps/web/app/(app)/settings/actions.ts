"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import {
  API_URL,
  clearSessionCookies,
  getServerAuthHeader,
  REFRESH_COOKIE,
} from "@/lib/auth/session"

export async function logoutAction() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
  if (refreshToken) {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      })
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
}

export async function twoFactorSendCodeAction(): Promise<ActionState> {
  try {
    const res = await fetch(`${API_URL}/api/auth/2fa/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await getServerAuthHeader()) },
    })
    if (!res.ok) return { error: "Failed to send code." }
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
    const res = await fetch(`${API_URL}/api/auth/2fa/enable`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await getServerAuthHeader()) },
      body: JSON.stringify({ code }),
    })
    const body = await res.json()
    if (!res.ok) return { error: (body.message as string) ?? "Invalid code." }
  } catch {
    return { error: "Could not reach the server." }
  }
  redirect("/settings")
}

export async function twoFactorDisableAction(): Promise<ActionState> {
  try {
    const res = await fetch(`${API_URL}/api/auth/2fa/disable`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await getServerAuthHeader()) },
    })
    if (!res.ok) return { error: "Failed to disable 2FA." }
  } catch {
    return { error: "Could not reach the server." }
  }
  redirect("/settings")
}
