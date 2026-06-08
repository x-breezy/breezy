import { z } from "zod"

export const signInSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
})
export type SignInDTO = z.infer<typeof signInSchema>

export const signUpSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(128),
})
export type SignUpDTO = z.infer<typeof signUpSchema>
