export interface Profile {
  profileId: string
  roles: string[]
  username: string
  firstName: string | null
  lastName: string | null
  bio: string | null
  avatarId: string | null
  followersCount: number
  followingCount: number
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}
