import type { Role } from "../constants/roles"
import type { Permission } from "../constants/permissions"
import { ROLE_PERMISSIONS, VISITOR_PERMISSIONS } from "../constants/rbac"

/**
 * Resolve the effective permission set for a set of roles.
 *
 * - Deduplicated union of every role's permissions.
 * - Empty roles (or only unknown roles) -> visitor permission set.
 *
 * Pure function, no DB. The resulting list is what gets embedded in the JWT later,
 * alongside the roles, under a token shaped like: { sub: userId, roles, permissions }.
 */
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

export function hasPermission(roles: Role[], permission: Permission): boolean {
  const perms = getPermissions(roles)
  return perms.includes(permission)
}
