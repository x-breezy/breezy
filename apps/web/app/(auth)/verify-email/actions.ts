"use server"

import { redirect } from "next/navigation"
import { getAuthActionError } from "@/lib/auth/api-error"
import { API_URL } from "@/lib/auth/session"

interface ActionState {
  error: string | null
  success: boolean
  code?: string
  retryAfter?: number
}

export async function verifyEmailAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const token = formData.get("token") as string

  try {
    const res = await fetch(`${API_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })

    if (!res.ok) {
      return { ...(await getAuthActionError(res, "Verification failed.")), success: false }
    }
  } catch {
    return { error: "Could not reach the server.", success: false }
  }

  redirect("/sign-in")
}

export async function resendVerificationAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get("email") as string

  try {
    const res = await fetch(`${API_URL}/api/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })

    if (!res.ok) {
      return { ...(await getAuthActionError(res, "Could not resend the email.")), success: false }
    }
  } catch {
    return { error: "Could not reach the server.", success: false }
  }

  return { error: null, success: true }
}
