import type { Role } from "../constants/roles"
import type { Permission } from "../constants/permissions"
import { ROLE_PERMISSIONS, VISITOR_PERMISSIONS } from "../constants/rbac"

export function getPermissions(role?: Role): Permission[] {
  const granted = new Set<Permission>()

  if (!role) return [...VISITOR_PERMISSIONS]

  const perms = ROLE_PERMISSIONS[role]
  if (perms) {
    for (const p of perms) granted.add(p)
  }

  if (granted.size === 0) {
    return [...VISITOR_PERMISSIONS]
  }

  return [...granted]
}
