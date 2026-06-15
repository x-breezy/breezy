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
import { signUp, getMe } from "@/lib/services/auth-service"
import { createProfile } from "@/lib/services/profile-service"
import { uploadImage } from "@/lib/services/image-service"

export interface ActionState {
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
    const { data } = await signUp(username, email, password)
    const { token, refreshToken } = data.data as { token: string; refreshToken: string }
    await setSessionCookies(token, refreshToken)
  } catch (err) {
    if (isAxiosError(err)) return { error: err.response?.data?.message ?? "Something went wrong." }
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
    // Récupérer le username de l'utilisateur avec validation
    const userRes = await getMe(authHeader)
    if (!userRes?.data?.data?.username) {
      return { error: "Invalid user data", success: false }
    }

    const username = userRes.data.data.username

    // Valider les données avant création
    if (!userId || !username) {
      return { error: "Missing required user information", success: false }
    }

    await createProfile(userId, { username, firstName, lastName, bio, avatarId }, authHeader)
    revalidatePath("/", "layout")
  } catch (err) {
    if (isAxiosError(err))
      return { error: err.response?.data?.message ?? "Something went wrong.", success: false }
    return { error: "Could not reach the server.", success: false }
  }

  return { error: null, success: true }
}
