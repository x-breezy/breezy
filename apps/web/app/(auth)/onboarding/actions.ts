"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { isAxiosError } from "axios"
import {
  setSessionCookies,
  API_URL,
  getServerAuthHeader,
  ACCESS_COOKIE,
  getUserId,
} from "@/lib/auth/session"
import { getMe } from "@/lib/services/auth-service"
import { createProfile } from "@/lib/services/profile-service"
import { uploadImage } from "@/lib/services/image-service"

export interface ActionState {
  error: string | null
  success?: boolean
}

export async function setupProfileAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_COOKIE)?.value
  if (!token) return { error: "Not authenticated.", success: false }

  let userId: string
  try {
    userId = await getUserId()
  } catch {
    return { error: "Invalid session. Please sign in again.", success: false }
  }

  const authHeader = await getServerAuthHeader()

  const firstName = (formData.get("firstName") as string) || null
  const lastName = (formData.get("lastName") as string) || null
  const bio = (formData.get("bio") as string) || null
  const avatarFile = formData.get("avatar") as File | null

  let avatarId: string | null = null

  if (avatarFile && avatarFile.size > 0) {
    if (!avatarFile.type.startsWith("image/")) {
      return { error: "Avatar must be an image file.", success: false }
    }

    try {
      const uploadRes = await uploadImage(avatarFile, authHeader)
      const imageId = uploadRes.data?.data?._doc?._id ?? uploadRes.data?.data?.id
      if (!imageId) return { error: "Avatar upload returned no image id.", success: false }

      avatarId = `${API_URL}/api/media/images/${imageId}`
    } catch (err) {
      if (isAxiosError(err)) {
        return {
          error:
            err.response?.data?.message ?? err.response?.data?.error ?? "Avatar upload failed.",
          success: false,
        }
      }
      return { error: "Could not upload avatar.", success: false }
    }
  }

  try {
    const userRes = await getMe(authHeader)
    if (!userRes?.data?.data?.username) {
      return { error: "Invalid user data", success: false }
    }

    const username = userRes.data.data.username

    await createProfile(userId, { username, firstName, lastName, bio, avatarId }, authHeader)

    cookieStore.set("has_profile", "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
    })

    revalidatePath("/", "layout")
  } catch (err) {
    if (isAxiosError(err))
      return { error: err.response?.data?.message ?? "Something went wrong.", success: false }
    return { error: "Could not reach the server.", success: false }
  }

  return { error: null, success: true }
}
