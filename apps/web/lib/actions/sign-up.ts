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
import { signUp, getMe, notifyProfileCreated } from "@/lib/services/auth-service"
import { createProfile } from "@/lib/services/profile-service"
import { uploadImage } from "@/lib/services/image-service"
import { usernameSchema, nameFieldSchema, bioSchema } from "@/lib/schemas/user-validation"

export interface ActionState {
  error: string | null
  success?: boolean
}

export async function signUpAction(
  _prev: ActionState | null,
  formData: FormData
): Promise<ActionState> {
  const username = (formData.get("username") as string).toLowerCase()
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const usernameResult = usernameSchema.safeParse(username)
  if (!usernameResult.success) {
    return { error: usernameResult.error.issues[0]!.message }
  }

  try {
    const { data } = await signUp(username, email, password)
    const { token, refreshToken } = data.data as { token: string; refreshToken: string }
    await setSessionCookies(token, refreshToken)
  } catch (err) {
    if (isAxiosError(err)) {
      const data = err.response?.data as Record<string, unknown> | undefined
      return { error: (data?.message ?? data?.error ?? "Something went wrong.") as string }
    }
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

  const firstNameRaw = (formData.get("firstName") as string) || null
  const lastNameRaw = (formData.get("lastName") as string) || null
  const bioRaw = (formData.get("bio") as string) || null

  const firstNameResult = nameFieldSchema.safeParse(firstNameRaw)
  if (!firstNameResult.success) {
    return { error: firstNameResult.error.issues[0]!.message, success: false }
  }
  const lastNameResult = nameFieldSchema.safeParse(lastNameRaw)
  if (!lastNameResult.success) {
    return { error: lastNameResult.error.issues[0]!.message, success: false }
  }
  const bioResult = bioSchema.safeParse(bioRaw)
  if (!bioResult.success) {
    return { error: bioResult.error.issues[0]!.message, success: false }
  }

  const firstName = firstNameResult.data
  const lastName = lastNameResult.data
  const bio = bioResult.data
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

    try {
      await createProfile(userId, { username, firstName, lastName, bio, avatarId }, authHeader)
    } catch (err) {
      if (isAxiosError(err) && err.response?.status !== 409) {
        const data = err.response?.data as Record<string, unknown> | undefined
        return {
          error: (data?.message ?? data?.error ?? "Something went wrong.") as string,
          success: false,
        }
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
      } catch {
        /* no-op */
      }
    }
  } catch (err) {
    if (isAxiosError(err)) {
      const data = err.response?.data as Record<string, unknown> | undefined
      return {
        error: (data?.message ?? data?.error ?? "Something went wrong.") as string,
        success: false,
      }
    }
    return { error: "Could not reach the server.", success: false }
  }

  redirect("/")
}
