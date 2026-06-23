export const PERMISSIONS = {
  PROFILE_READ: "profile:read",
  PROFILE_READ_ANY: "profile:read:any",
  PROFILE_UPDATE_OWN: "profile:update:own",
  PROFILE_DELETE_OWN: "profile:delete:own",
  FOLLOW_CREATE: "follow:create",
  FOLLOW_DELETE_OWN: "follow:delete:own",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
