"use server"

import { isAxiosError } from "axios"
import { getServerAuthHeader, API_URL } from "@/lib/auth/session"
import { updateProfile } from "@/lib/services/profile-service"
import { uploadImage } from "@/lib/services/image-service"
import type { Profile } from "@/types/profile"
import { nameFieldSchema, bioSchema } from "@/lib/schemas/user-validation"

export interface UpdateProfileState {
  error: string | null
  success: boolean
  profile?: Profile
}

export async function updateProfileAction(
  _prev: UpdateProfileState | null,
  formData: FormData
): Promise<UpdateProfileState> {
  const authHeader = await getServerAuthHeader()
  const profileId = formData.get("profileId") as string

  let avatarId: string | undefined

  const avatarFile = formData.get("avatar") as File | null
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
        return { error: err.response?.data?.message ?? "Avatar upload failed.", success: false }
      }
      return { error: "Could not upload avatar.", success: false }
    }
  }

  const firstNameRaw = (formData.get("firstName") as string) || null
  const lastNameRaw = (formData.get("lastName") as string) || null

  const firstNameResult = nameFieldSchema.safeParse(firstNameRaw)
  if (!firstNameResult.success) {
    return { error: firstNameResult.error.issues[0]!.message, success: false }
  }
  const lastNameResult = nameFieldSchema.safeParse(lastNameRaw)
  if (!lastNameResult.success) {
    return { error: lastNameResult.error.issues[0]!.message, success: false }
  }

  const bioRaw = (formData.get("bio") as string) || null
  const bioResult = bioSchema.safeParse(bioRaw)
  if (!bioResult.success) {
    return { error: bioResult.error.issues[0]!.message, success: false }
  }

  const payload = {
    firstName: firstNameResult.data,
    lastName: lastNameResult.data,
    username: formData.get("username") as string,
    bio: bioResult.data,
    ...(avatarId !== undefined && { avatarId }),
  }

  try {
    const res = await updateProfile(profileId, payload, authHeader)
    return { error: null, success: true, profile: res.data.data }
  } catch (err) {
    if (isAxiosError(err)) {
      return { error: err.response?.data?.message ?? "Failed to update profile.", success: false }
    }
    return { error: "Could not reach the server.", success: false }
  }
}
