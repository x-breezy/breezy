export interface User {
  id: string
  username: string
  email: string
  role: string
  isBanned: boolean
  isEmailVerified: boolean
  twoFactorEnabled: boolean
  createdAt: string
  updatedAt: string
}
