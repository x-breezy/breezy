import type { Role } from "../constants/roles"
import type { Permission } from "../constants/permissions"
import { ROLE_PERMISSIONS, VISITOR_PERMISSIONS } from "../constants/rbac"

/**
 * Resolve the effective permission set for a set of role.
 *
 * - Deduplicated union of every role's permissions.
 * - Empty role (or only unknown role) -> visitor permission set.
 *
 * Pure function, no DB. The resulting list is what gets embedded in the JWT later,
 * alongside the role, under a token shaped like: { sub: userId, role, permissions }.
 */
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

export function hasPermission(role: Role, permission: Permission): boolean {
  const perms = getPermissions(role)
  return perms.includes(permission)
}
