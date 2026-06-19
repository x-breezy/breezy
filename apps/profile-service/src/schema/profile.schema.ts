import { z } from "zod"

const nameRegex = /^[\p{L}\s'.0-9-]+$/u
const nameMessage = "Name can only contain letters, numbers, spaces, apostrophes, hyphens, and periods"
const usernameMessage = "Can only contain lowercase letters, numbers, underscores, and hyphens"

const nameField = z
  .string()
  .min(1, "Must be at least 1 character")
  .max(100)
  .regex(nameRegex, nameMessage)
  .nullable()
  .optional()

const bioField = z
  .string()
  .trim()
  .transform((val) => val.replace(/\n{2,}/g, "\n"))
  .pipe(
    z
      .string()
      .max(200, "Bio must be 200 characters or fewer")
      .refine((val) => (val.match(/\n/g) || []).length < 4, "Bio must be fewer than 5 lines")
  )
  .nullable()
  .optional()

export const createProfileSchema = z.object({
  username: z
    .string()
    .max(100)
    .regex(/^[a-z0-9_-]+$/, usernameMessage),
  firstName: nameField,
  lastName: nameField,
  bio: bioField,
  avatarId: z.string().url().max(500).nullable().optional(),
})

export const updateProfileSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  bio: bioField,
  avatarId: z.string().url().max(500).nullable().optional(),
})

export const followSchema = z.object({
  followingId: z.string().uuid(),
})

export const profileIdParamSchema = z.object({
  profileId: z.string().uuid(),
})

export const usernameParamSchema = z.object({
  username: z
    .string()
    .max(100)
    .regex(/^[a-z0-9_-]+$/, usernameMessage),
})

export type CreateProfileDTO = z.infer<typeof createProfileSchema>
export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>
export type FollowDTO = z.infer<typeof followSchema>
