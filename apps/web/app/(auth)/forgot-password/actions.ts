"use server"

import { getAuthActionError } from "@/lib/auth/api-error"
import { API_URL } from "@/lib/auth/session"

interface ActionState {
  error: string | null
  sent: boolean
  code?: string
  retryAfter?: number
}

export async function forgotPasswordAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email") as string

  try {
    const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    if (!res.ok) {
      return { ...(await getAuthActionError(res, "Something went wrong.")), sent: false }
    }
  } catch {
    return { error: "Could not reach the server.", sent: false }
  }

  return { error: null, sent: true }
}
