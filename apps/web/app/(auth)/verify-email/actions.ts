"use server"

import { redirect } from "next/navigation"
import { getAuthActionError } from "@/lib/auth/api-error"
import { verifyEmail, resendVerificationEmail } from "@/lib/services/auth-service"

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
    const res = await verifyEmail(token)
    if (!res.ok) return { ...(await getAuthActionError(res, "Verification failed.")), success: false }
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
    const res = await resendVerificationEmail(email)
    if (!res.ok)
      return { ...(await getAuthActionError(res, "Could not resend the email.")), success: false }
  } catch {
    return { error: "Could not reach the server.", success: false }
  }

  return { error: null, success: true }
}
