"use server"

import { redirect } from "next/navigation"
import { setSessionCookies, API_URL } from "@/lib/auth/session"

interface ActionState {
  error: string | null
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

    const body = await res.json()

    if (!res.ok) {
      return { error: (body.message as string) ?? "Invalid code." }
    }

    token = body.data.token
    refreshToken = body.data.refreshToken
  } catch {
    return { error: "Could not reach the server." }
  }

  await setSessionCookies(token, refreshToken)

  redirect("/")
}
