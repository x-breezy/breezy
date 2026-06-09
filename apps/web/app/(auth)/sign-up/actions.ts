"use server"

import { cookies } from "next/headers"
import { setSessionCookies, getServerAuthHeader, ACCESS_COOKIE } from "@/lib/auth/session"
import { signUp } from "@/lib/services/auth-service"

function getUserIdFromToken(token: string): string | null {
  try {
    const part = token.split(".")[1]
    if (!part) return null
    const payload = JSON.parse(Buffer.from(part, "base64").toString()) as { sub?: string }
    return payload.sub ?? null
  } catch {
    return null
  }
}

interface ActionState {
  error: string | null
  success?: boolean
}

export async function signUpAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const username = formData.get("username") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  try {
    const res = await signUp(username, email, password)
    const body = await res.json()

    if (!res.ok) {
      return { error: (body.message as string) ?? "Something went wrong." }
    }

    const { token, refreshToken } = body.data as { token: string; refreshToken: string }
    await setSessionCookies(token, refreshToken)
  } catch {
    return { error: "Could not reach the server." }
  }

  return { error: null, success: true }
}

export async function setupProfileAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_COOKIE)?.value
  if (!token) return { error: "Not authenticated." }

  const userId = getUserIdFromToken(token)
  if (!userId) return { error: "Invalid session." }

  const authHeader = await getServerAuthHeader()

  const firstName = (formData.get("firstName") as string) || null
  const lastName = (formData.get("lastName") as string) || null
  const bio = (formData.get("bio") as string) || null
  const avatarFile = formData.get("avatar") as File | null

  let avatarUrl: string | null = null

  if (avatarFile && avatarFile.size > 0) {
    try {
      const buffer = Buffer.from(await avatarFile.arrayBuffer())
      const uploadRes = await fetch(`${API_URL}/api/media/images`, {
        method: "POST",
        headers: {
          "Content-Type": avatarFile.type,
          "X-Filename": avatarFile.name,
          ...authHeader,
        },
        body: buffer,
      })
      if (uploadRes.ok) {
        const uploadBody = (await uploadRes.json()) as { data?: { id?: string } }
        const imageId = uploadBody.data?.id
        if (imageId) avatarUrl = `/api/media/images/${imageId}`
      }
    } catch {
      // Avatar upload failed; proceed without it.
    }
  }

  try {
    const res = await fetch(`${API_URL}/api/profiles/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ profileId: userId, firstName, lastName, bio, avatarUrl }),
    })
    if (!res.ok) {
      const body = (await res.json()) as { message?: string }
      return { error: body.message ?? "Failed to create profile." }
    }
  } catch {
    return { error: "Could not reach the server." }
  }

  return { error: null, success: true }
}
