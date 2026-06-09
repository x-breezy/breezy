"use server"

import { API_URL } from "@/lib/auth/session"

interface ActionState {
  error: string | null
  sent: boolean
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
      return { error: "Something went wrong.", sent: false }
    }
  } catch {
    return { error: "Could not reach the server.", sent: false }
  }

  return { error: null, sent: true }
}
