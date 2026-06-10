import { z } from "zod"

export const createProfileSchema = z.object({
  profileId: z.string().uuid(),
  username: z.string().max(100),
  firstName: z.string().max(100).nullable().optional(),
  lastName: z.string().max(100).nullable().optional(),
  bio: z.string().nullable().optional(),
  avatarId: z.string().url().max(500).nullable().optional(),
})

export const updateProfileSchema = z.object({
  firstName: z.string().max(100).nullable().optional(),
  lastName: z.string().max(100).nullable().optional(),
  bio: z.string().nullable().optional(),
  avatarId: z.string().url().max(500).nullable().optional(),
})

export const followSchema = z.object({
  followingId: z.string().uuid(),
})

export const profileIdParamSchema = z.object({
  profileId: z.string().uuid(),
})

export type CreateProfileDTO = z.infer<typeof createProfileSchema>
export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>
export type FollowDTO = z.infer<typeof followSchema>
