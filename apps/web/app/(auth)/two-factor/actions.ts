"use server"

import { redirect } from "next/navigation"
import { getAuthActionError } from "@/lib/auth/api-error"
import { setSessionCookies, API_URL } from "@/lib/auth/session"

interface ActionState {
  error: string | null
  success?: boolean
  code?: string
  retryAfter?: number
}

export async function twoFactorAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const pendingToken = formData.get("pendingToken") as string
  const code = formData.get("code") as string

  let token: string
  let refreshToken: string

  try {
    const res = await fetch(`${API_URL}/api/auth/2fa/verify-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingToken, code }),
    })

    if (!res.ok) {
      return await getAuthActionError(res, "Invalid code.")
    }

    const body = await res.json()
    token = body.data.token
    refreshToken = body.data.refreshToken
  } catch {
    return { error: "Could not reach the server." }
  }

  await setSessionCookies(token, refreshToken)

  redirect("/")
}

export async function resendTwoFactorCodeAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const pendingToken = formData.get("pendingToken") as string

  try {
    const res = await fetch(`${API_URL}/api/auth/2fa/resend-login-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pendingToken }),
    })

    if (!res.ok) {
      return await getAuthActionError(res, "Could not resend the code.")
    }
  } catch {
    return { error: "Could not reach the server." }
  }

  return { error: null, success: true }
}
