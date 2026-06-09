"use server"

import { redirect } from "next/navigation"
import { setSessionCookies, API_URL } from "@/lib/auth/session"

interface ActionState {
  error: string | null
}

export async function signInAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const identifier = formData.get("identifier") as string
  const password = formData.get("password") as string

  let accessToken: string
  let refreshToken: string

  try {
    const res = await fetch(`${API_URL}/api/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    })
    const body = await res.json()
    if (!res.ok) {
      return { error: (body.message as string) ?? "Something went wrong." }
    }
    accessToken = body.data.token
    refreshToken = body.data.refreshToken
  } catch {
    return { error: "Could not reach the server." }
  }

  await setSessionCookies(accessToken, refreshToken)

  redirect("/")
}
