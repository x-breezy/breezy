import { ROLES, type Role } from "./roles"
import { PERMISSIONS, type Permission } from "./permissions"

const USER_PERMISSIONS: Permission[] = [
  PERMISSIONS.PROFILE_READ,
  PERMISSIONS.PROFILE_UPDATE_OWN,
  PERMISSIONS.PROFILE_DELETE_OWN,
  PERMISSIONS.FOLLOW_CREATE,
  PERMISSIONS.FOLLOW_DELETE_OWN,
]

const MODERATOR_PERMISSIONS: Permission[] = [...USER_PERMISSIONS, PERMISSIONS.PROFILE_READ_ANY]

const ADMIN_PERMISSIONS: Permission[] = [...MODERATOR_PERMISSIONS]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.USER]: USER_PERMISSIONS,
  [ROLES.MODERATOR]: MODERATOR_PERMISSIONS,
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
}

export function getPermissions(role?: Role): Permission[] {
  const granted = new Set<Permission>()
  if (!role) return [...granted]

  const perms = ROLE_PERMISSIONS[role]
  if (perms) perms.forEach((p) => granted.add(p))
  return [...granted]
}
