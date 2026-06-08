import { ROLES, type Role } from "./roles"
import { PERMISSIONS, type Permission } from "./permissions"

const USER_PERMISSIONS: Permission[] = [
  PERMISSIONS.NOTIFICATION_READ,
  PERMISSIONS.NOTIFICATION_DELETE,
]

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.USER]: USER_PERMISSIONS,
  [ROLES.MODERATOR]: USER_PERMISSIONS,
  [ROLES.ADMIN]: USER_PERMISSIONS,
}

export const VISITOR_PERMISSIONS: Permission[] = []
