export interface User {
  id: string
  username: string
  email: string
  roles: string[]
  isBanned: boolean
  isSuspended: boolean
  isEmailVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
}
