import { Role, ROLES } from "../constants/roles"

export function getElevatedRoleFromRoles(role: Role[]): Role {
  return role.includes(ROLES.ADMIN)
    ? ROLES.ADMIN
    : role.includes(ROLES.MODERATOR)
      ? ROLES.MODERATOR
      : ROLES.USER
}
