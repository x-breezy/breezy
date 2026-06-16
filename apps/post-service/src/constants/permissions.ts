export const PERMISSIONS = {
  POST_CREATE: "post:create",
  POST_READ: "post:read",
  POST_READ_ANY: "post:read:any",
  POST_UPDATE_OWN: "post:update:own",
  POST_UPDATE_ANY: "post:update:any",
  POST_DELETE_OWN: "post:delete:own",
  POST_DELETE_ANY: "post:delete:any",
  LIKE_CREATE: "like:create",
  LIKE_DELETE_OWN: "like:delete:own",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
