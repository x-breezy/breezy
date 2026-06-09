"use server"

import { redirect } from "next/navigation"
import { API_URL } from "@/lib/auth/session"

interface ActionState {
  error: string | null
}

export async function resetPasswordAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const token = formData.get("token") as string
  const password = formData.get("password") as string

  try {
    const res = await fetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })

    const body = await res.json()

    if (!res.ok) {
      return { error: (body.message as string) ?? "Reset failed." }
    }
  } catch {
    return { error: "Could not reach the server." }
  }

  redirect("/sign-in")
}
