import { ROLES, type Role } from "./roles"
import { PERMISSIONS, type Permission } from "./permissions"

/**
 * Permissions granted to a caller with no role (anonymous visitor).
 */
export const VISITOR_PERMISSIONS: Permission[] = [
  PERMISSIONS.ACCOUNT_CREATE,
  PERMISSIONS.SETTINGS_THEME,
]

/**
 * Base permissions for an authenticated user. Ownership-scoped actions (:own) are granted here;
 * the resource service still performs the runtime owner check.
 */
const USER_PERMISSIONS: Permission[] = [
  PERMISSIONS.POST_CREATE,
  PERMISSIONS.POST_READ,
  PERMISSIONS.POST_UPDATE_OWN,
  PERMISSIONS.POST_DELETE_OWN,
  PERMISSIONS.POST_SEARCH,
  PERMISSIONS.COMMENT_CREATE,
  PERMISSIONS.COMMENT_DELETE_OWN,
  PERMISSIONS.LIKE_CREATE,
  PERMISSIONS.LIKE_DELETE_OWN,
  PERMISSIONS.FOLLOW_CREATE,
  PERMISSIONS.FOLLOW_DELETE_OWN,
  PERMISSIONS.USER_READ,
  PERMISSIONS.PROFILE_READ,
  PERMISSIONS.PROFILE_UPDATE_OWN,
  PERMISSIONS.DM_SEND,
  PERMISSIONS.REPORT_CREATE,
  PERMISSIONS.SETTINGS_LANGUAGE,
  PERMISSIONS.SETTINGS_THEME,
]

/**
 * Moderator = user permissions + cross-owner (:any) moderation capabilities.
 */
const MODERATOR_PERMISSIONS: Permission[] = [
  ...USER_PERMISSIONS,
  PERMISSIONS.POST_UPDATE_ANY,
  PERMISSIONS.POST_DELETE_ANY,
  PERMISSIONS.COMMENT_DELETE_ANY,
  PERMISSIONS.REPORT_RESOLVE,
  PERMISSIONS.USER_SUSPEND,
  PERMISSIONS.USER_BAN,
]

/**
 * Admin = every permission in the catalog (superset).
 */
const ADMIN_PERMISSIONS: Permission[] = [...MODERATOR_PERMISSIONS, PERMISSIONS.ACCOUNT_CREATE]

/**
 * Role -> granted permissions. Static, code-defined RBAC (no DB tables).
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.USER]: USER_PERMISSIONS,
  [ROLES.MODERATOR]: MODERATOR_PERMISSIONS,
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
}
