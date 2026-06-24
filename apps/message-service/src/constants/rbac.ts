import { ROLES, type Role } from "./roles"
import { PERMISSIONS, type Permission } from "./permissions"

const USER_PERMISSIONS: Permission[] = [
  PERMISSIONS.MESSAGE_CREATE,
  PERMISSIONS.MESSAGE_READ,
  PERMISSIONS.MESSAGE_DELETE_OWN,
]

const MODERATOR_PERMISSIONS: Permission[] = [...USER_PERMISSIONS]

const ADMIN_PERMISSIONS: Permission[] = [...MODERATOR_PERMISSIONS]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.USER]: USER_PERMISSIONS,
  [ROLES.MODERATOR]: MODERATOR_PERMISSIONS,
  [ROLES.ADMIN]: ADMIN_PERMISSIONS,
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}
