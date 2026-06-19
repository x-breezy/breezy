import { z } from "zod"

export const usernameRegex = /^[a-z0-9_-]+$/

export const usernameSchema = z
  .string()
  .min(3, "usernameMinLength")
  .max(50, "usernameMaxLength")
  .regex(usernameRegex, "usernameInvalidChars")

export const nameRegex = /^[\p{L}\s'.0-9-]+$/u

export const nameFieldSchema = z
  .string()
  .min(1, "nameMinLength")
  .max(100, "nameMaxLength")
  .regex(nameRegex, "nameInvalidChars")
  .nullable()
  .optional()

export const bioSchema = z
  .string()
  .trim()
  .transform((val) => val.replace(/\n{2,}/g, "\n"))
  .pipe(
    z
      .string()
      .max(200, "bioMaxLength")
      .refine((val) => (val.match(/\n/g) || []).length < 4, "bioMaxLines")
  )
  .nullable()
  .optional()
