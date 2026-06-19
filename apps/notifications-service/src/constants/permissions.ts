export const PERMISSIONS = {
  NOTIFICATION_READ: "notification:read",
  NOTIFICATION_DELETE: "notification:delete",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
