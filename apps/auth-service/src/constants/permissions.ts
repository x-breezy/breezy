export const PERMISSIONS = {
  ACCOUNT_CREATE: "account:create",

  POST_CREATE: "post:create",
  POST_READ: "post:read",
  POST_UPDATE_OWN: "post:update:own",
  POST_UPDATE_ANY: "post:update:any",
  POST_DELETE_OWN: "post:delete:own",
  POST_DELETE_ANY: "post:delete:any",
  POST_SEARCH: "post:search",

  COMMENT_CREATE: "comment:create",
  COMMENT_DELETE_OWN: "comment:delete:own",
  COMMENT_DELETE_ANY: "comment:delete:any",

  LIKE_CREATE: "like:create",
  LIKE_DELETE_OWN: "like:delete:own",

  FOLLOW_CREATE: "follow:create",
  FOLLOW_DELETE_OWN: "follow:delete:own",

  PROFILE_READ: "profile:read",
  PROFILE_UPDATE_OWN: "profile:update:own",

  DM_SEND: "dm:send",

  REPORT_CREATE: "report:create",
  REPORT_RESOLVE: "report:resolve",

  USER_READ: "user:read",
  USER_SUSPEND: "user:suspend",
  USER_BAN: "user:ban",

  SETTINGS_LANGUAGE: "settings:language",
  SETTINGS_THEME: "settings:theme",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
