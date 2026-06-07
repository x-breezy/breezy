export const PERMISSIONS = {
  ACCOUNT_CREATE: "account:create",

  USER_READ: "user:read",
  USER_CREATE: "user:create",
  USER_SUSPEND: "user:suspend",
  USER_BAN: "user:ban",

  REPORT_CREATE: "report:create",
  REPORT_RESOLVE: "report:resolve",
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
