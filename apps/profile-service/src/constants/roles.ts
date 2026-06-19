export const ROLES = {
  USER: "user",
  MODERATOR: "moderator",
  ADMIN: "admin",
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]
