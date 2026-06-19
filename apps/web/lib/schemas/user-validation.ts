import { z } from "zod"

export const usernameRegex = /^[a-z0-9_-]+$/

export const usernameSchema = z
  .string()
  .min(3, "usernameMinLength")
  .max(50, "usernameMaxLength")
  .regex(usernameRegex, "usernameInvalidChars")

export const nameFieldSchema = z
  .string()
  .min(1, "nameMinLength")
  .max(100, "nameMaxLength")
  .regex(usernameRegex, "nameInvalidChars")
  .nullable()
  .optional()
