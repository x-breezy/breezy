"use server"

import { redirect } from "next/navigation"
import { resetPassword } from "@/lib/services/auth-service"

interface ActionState {
  error: string | null
  success: boolean
}

export async function resetPasswordAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const token = formData.get("token") as string
  const password = formData.get("password") as string

  try {
    await resetPassword(token, password)
    return { error: null, success: true }
  } catch {
    return { error: "Could not reach the server.", success: false }
  }

  redirect("/sign-in")
}
