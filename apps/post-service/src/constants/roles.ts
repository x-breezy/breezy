export const ROLES = {
  USER: "user",
  ADMIN: "admin",
  MODERATOR: "moderator",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]
