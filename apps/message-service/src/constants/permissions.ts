export const PERMISSIONS = {
  MESSAGE_CREATE: "message:create",
  MESSAGE_READ: "message:read",
  MESSAGE_DELETE_OWN: "message:delete:own",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
