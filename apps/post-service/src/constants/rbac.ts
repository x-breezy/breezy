import { ROLES, type Role } from "./roles"
import { PERMISSIONS, type Permission } from "./permissions"

const USER_PERMISSIONS: Permission[] = [
  PERMISSIONS.POST_CREATE,
  PERMISSIONS.POST_READ,
  PERMISSIONS.POST_READ_ANY,
  PERMISSIONS.POST_UPDATE_OWN,
  PERMISSIONS.POST_DELETE_OWN,
  PERMISSIONS.COMMENT_CREATE,
  PERMISSIONS.COMMENT_DELETE_OWN,
  PERMISSIONS.LIKE_CREATE,
  PERMISSIONS.LIKE_DELETE_OWN,
]

const MODERATOR_PERMISSIONS: Permission[] = [
  ...USER_PERMISSIONS,
  PERMISSIONS.POST_READ_ANY,
  PERMISSIONS.POST_UPDATE_ANY,
  PERMISSIONS.POST_DELETE_ANY,
  PERMISSIONS.COMMENT_DELETE_ANY,
]

const ADMIN_PERMISSIONS: Permission[] = [...MODERATOR_PERMISSIONS]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.USER]: USER_PERMISSIONS,
  [ROLES.MODERATOR]: MODERATOR_PERMISSIONS,
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
}

export function getPermissions(role?: Role): Permission[] {
  const granted = new Set<Permission>()
  if (role) {
    const perms = ROLE_PERMISSIONS[role]
    if (perms) perms.forEach((p) => granted.add(p))
  }
  return [...granted]
}
