import { z } from "zod"

export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters"),
  email: z.string().email("Invalid email address"),
  passwordHash: z.string().min(1, "Password hash is required"),
  roleId: z.string().uuid("Invalid role UUID"),
})

export const updateUserSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be at most 50 characters")
      .optional(),
    passwordHash: z.string().min(1, "Password hash is required").optional(),
    isVerified: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })

export const emailParamSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const idParamSchema = z.object({
  id: z.string().uuid("Invalid UUID"),
})

export type CreateUserSchema = z.infer<typeof createUserSchema>
export type UpdateUserSchema = z.infer<typeof updateUserSchema>
