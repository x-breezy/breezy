"use server"

import { isAxiosError } from "axios"
import { forgotPassword } from "@/lib/services/auth-service"

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
    await forgotPassword(email)
  } catch (err) {
    if (isAxiosError(err)) {
      const d = err.response?.data as { message?: string; code?: string }
      return {
        error: d?.message ?? "Something went wrong.",
        code: d?.code,
        retryAfter: err.response?.status === 429 ? 60 : undefined,
        sent: false,
      }
    }
    return { error: "Could not reach the server.", sent: false }
  }

  return { error: null, sent: true }
}
