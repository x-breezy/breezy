import { z } from "zod"

const nameRegex = /^[\p{L}\s'.-]+$/u
const nameMessage = "Name can only contain letters, spaces, apostrophes, hyphens, and periods"
const usernameMessage = "Can only contain lowercase letters, numbers, underscores, and hyphens"

const nameField = z
  .string()
  .min(1, "Must be at least 1 character")
  .max(100)
  .regex(nameRegex, nameMessage)
  .nullable()
  .optional()

export const createProfileSchema = z.object({
  username: z
    .string()
    .max(100)
    .regex(/^[a-z0-9_-]+$/, usernameMessage),
  firstName: nameField,
  lastName: nameField,
  bio: z.string().nullable().optional(),
  avatarId: z.string().url().max(500).nullable().optional(),
})

export const updateProfileSchema = z.object({
  firstName: nameField,
  lastName: nameField,
  bio: z.string().nullable().optional(),
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
