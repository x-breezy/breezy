"use server"

import { redirect } from "next/navigation"
import { isAxiosError } from "axios"
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
    await verifyEmail(token)
  } catch (err) {
    if (isAxiosError(err))
      return { error: err.response?.data?.message ?? "Verification failed.", success: false }
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
    await resendVerificationEmail(email)
  } catch (err) {
    if (isAxiosError(err)) {
      const d = err.response?.data as { message?: string; code?: string }
      return {
        error: d?.message ?? "Could not resend the email.",
        code: d?.code,
        retryAfter: err.response?.status === 429 ? 60 : undefined,
        success: false,
      }
    }
    return { error: "Could not reach the server.", success: false }
  }

  return { error: null, success: true }
}
