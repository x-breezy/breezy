"use server"

import { redirect } from "next/navigation"
import { isAxiosError } from "axios"
import { setSessionCookies } from "@/lib/auth/session"
import { verifyTwoFactorLogin, resendTwoFactorLoginCode } from "@/lib/services/auth-service"

interface ActionState {
  error: string | null
  success?: boolean
  code?: string
  retryAfter?: number
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
    const { data } = await verifyTwoFactorLogin(pendingToken, code)
    token = data.data.token
    refreshToken = data.data.refreshToken
  } catch (err) {
    if (isAxiosError(err)) return { error: err.response?.data?.message ?? "Invalid code." }
    return { error: "Could not reach the server." }
  }

  await setSessionCookies(token, refreshToken)

  redirect("/")
}

export async function resendTwoFactorCodeAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const pendingToken = formData.get("pendingToken") as string

  try {
    await resendTwoFactorLoginCode(pendingToken)
  } catch (err) {
    if (isAxiosError(err)) {
      const d = err.response?.data as { message?: string; code?: string }
      return {
        error: d?.message ?? "Could not resend the code.",
        code: d?.code,
        retryAfter: err.response?.status === 429 ? 60 : undefined,
      }
    }
    return { error: "Could not reach the server." }
  }

  return { error: null, success: true }
}
