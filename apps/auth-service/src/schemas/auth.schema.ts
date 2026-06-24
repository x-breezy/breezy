import { z } from "zod"

/**
 * Shared password policy: 8-128 chars with at least one lowercase letter,
 * one uppercase letter, and one digit.
 */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[0-9]/, "Password must contain a digit")

export const signInSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
})
export type SignInDTO = z.infer<typeof signInSchema>

const usernameRegex = /^[a-z0-9_-]+$/
const usernameMessage =
  "Username can only contain lowercase letters, numbers, underscores, and hyphens"

export const signUpSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(usernameRegex, usernameMessage),
  email: z.string().email(),
  password: passwordSchema,
})
export type SignUpDTO = z.infer<typeof signUpSchema>

export const verifyEmailSchema = z.object({ token: z.string().uuid() })
export type VerifyEmailDTO = z.infer<typeof verifyEmailSchema>

export const resendVerificationSchema = z.object({ email: z.string().email() })
export type ResendVerificationDTO = z.infer<typeof resendVerificationSchema>

export const forgotPasswordSchema = z.object({ email: z.string().email() })
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z.object({
  token: z.string().uuid(),
  password: passwordSchema,
})
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>

export const refreshSchema = z.object({ refreshToken: z.string().min(1).optional() })
export type RefreshDTO = z.infer<typeof refreshSchema>

export const logoutSchema = z.object({ refreshToken: z.string().min(1) })
export type LogoutDTO = z.infer<typeof logoutSchema>

export const twoFactorVerifyLoginSchema = z.object({
  pendingToken: z.string(),
  code: z.string().length(6),
})
export type TwoFactorVerifyLoginDTO = z.infer<typeof twoFactorVerifyLoginSchema>

export const twoFactorResendLoginSchema = z.object({ pendingToken: z.string() })
export type TwoFactorResendLoginDTO = z.infer<typeof twoFactorResendLoginSchema>

export const twoFactorEnableSchema = z.object({ code: z.string().length(6) })
export type TwoFactorEnableDTO = z.infer<typeof twoFactorEnableSchema>

export const googleAuthSchema = z.object({
  code: z.string().min(1),
  codeVerifier: z.string().min(1),
  redirectUri: z.string().url(),
})
export type GoogleAuthDTO = z.infer<typeof googleAuthSchema>

export const googleCompleteSchema = z.object({
  pendingToken: z.string().min(1),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50)
    .regex(usernameRegex, usernameMessage),
})
export type GoogleCompleteDTO = z.infer<typeof googleCompleteSchema>
