// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  username: string
  email: string
  roleId: string
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

/** User without sensitive fields — safe to serialize as JSON. */
export type SafeUser = Omit<User, "passwordHash">

export interface UserCreateDTO {
  username: string
  email: string
  passwordHash: string
  roleId: string
}

export interface UserUpdateDTO {
  username?: string
  passwordHash?: string
  isVerified?: boolean
}
