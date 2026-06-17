"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { isAxiosError } from "axios"
import {
  setSessionCookies,
  API_URL,
  getServerAuthHeader,
  ACCESS_COOKIE,
  getUserId,
} from "@/lib/auth/session"
import { REFRESH_COOKIE } from "@/lib/auth/auth-cookies"
import { getMe, notifyProfileCreated } from "@/lib/services/auth-service"
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

    try {
      await createProfile(userId, { username, firstName, lastName, bio, avatarId }, authHeader)
    } catch (err) {
      if (isAxiosError(err) && err.response?.status !== 409) {
        return { error: err.response?.data?.message ?? "Something went wrong.", success: false }
      }
      if (!isAxiosError(err)) return { error: "Could not reach the server.", success: false }
    }

    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value
    if (refreshToken) {
      try {
        const res = await notifyProfileCreated(refreshToken)
        const data = res.data?.data as { token?: string; refreshToken?: string } | undefined
        if (data?.token && data?.refreshToken) {
          await setSessionCookies(data.token, data.refreshToken)
        }
      } catch (_) {
      }
    }

  } catch (err) {
    if (isAxiosError(err))
      return { error: err.response?.data?.message ?? "Something went wrong.", success: false }
    return { error: "Could not reach the server.", success: false }
  }

  redirect("/")
}
