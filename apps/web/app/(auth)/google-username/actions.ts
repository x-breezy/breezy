"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { isAxiosError } from "axios"
import { completeGoogleAuth } from "@/lib/services/auth-service"
import { setSessionCookies } from "@/lib/auth/session"

interface ActionState {
  error: string | null
}

export async function googleUsernameAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const username = formData.get("username") as string
  const pendingToken = formData.get("pendingToken") as string

  if (!pendingToken) {
    return { error: "Session expired. Please sign in with Google again." }
  }

  try {
    const result = await completeGoogleAuth(pendingToken, username)
    const { token, refreshToken } = result.data.data as { token: string; refreshToken: string }

    const cookieStore = await cookies()
    cookieStore.delete("pending_google_token")

    await setSessionCookies(token, refreshToken)
  } catch (err) {
    if (isAxiosError(err)) {
      const status = err.response?.status
      if (status === 401) {
        return { error: "Session expired. Please sign in with Google again." }
      }
      return { error: err.response?.data?.message ?? "Something went wrong." }
    }
    return { error: "Could not reach the server." }
  }

  redirect("/")
}
