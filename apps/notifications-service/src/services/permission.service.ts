import type { Role } from "../constants/roles"
import type { Permission } from "../constants/permissions"
import { ROLE_PERMISSIONS, VISITOR_PERMISSIONS } from "../constants/rbac"

export function getPermissions(roles: Role[]): Permission[] {
  const granted = new Set<Permission>()

  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role]
    if (perms) {
      for (const p of perms) granted.add(p)
    }
  }

  if (granted.size === 0) {
    return [...VISITOR_PERMISSIONS]
  }

  return [...granted]
}
