import { z } from "zod"

const usernameRegex = /^[a-z0-9_-]+$/

/** Registration input. Client sends a plain password; the service hashes it. */
export const createUserSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(
      usernameRegex,
      "Username can only contain lowercase letters, numbers, underscores, and hyphens"
    ),
  email: z.string().email(),
  password: z.string().min(8).max(128),
})
export type CreateUserDTO = z.infer<typeof createUserSchema>

/** Body for changing a password. */
export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
})
export type UpdatePasswordDTO = z.infer<typeof updatePasswordSchema>

/** Route param: user id is a UUID. */
export const userIdParamSchema = z.object({
  id: z.string().uuid(),
})

/** Query param for lookup by email. */
export const emailQuerySchema = z.object({
  email: z.string().email(),
})

/** Route param: lookup by username. */
export const usernameParamSchema = z.object({
  username: z.string().min(1),
})
