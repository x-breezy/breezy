import { getPermissions } from "../../services/permission.service"
import { PERMISSIONS } from "../../constants/permissions"
import { ROLES } from "../../constants/roles"
import { VISITOR_PERMISSIONS } from "../../constants/rbac"

describe("getPermissions", () => {
  it("grants all permissions to user role", () => {
    const perms = getPermissions([ROLES.USER])
    expect(perms).toContain(PERMISSIONS.NOTIFICATION_READ)
    expect(perms).toContain(PERMISSIONS.NOTIFICATION_DELETE)
  })

  it("grants all permissions to moderator role", () => {
    const perms = getPermissions([ROLES.MODERATOR])
    expect(perms).toContain(PERMISSIONS.NOTIFICATION_READ)
    expect(perms).toContain(PERMISSIONS.NOTIFICATION_DELETE)
  })

  it("grants all permissions to admin role", () => {
    const perms = getPermissions([ROLES.ADMIN])
    expect(perms).toContain(PERMISSIONS.NOTIFICATION_READ)
    expect(perms).toContain(PERMISSIONS.NOTIFICATION_DELETE)
  })

  it("returns visitor permissions for empty roles", () => {
    const perms = getPermissions([])
    expect(perms).toEqual(VISITOR_PERMISSIONS)
  })

  it("returns visitor permissions for unknown roles", () => {
    const perms = getPermissions(["ghost" as never])
    expect(perms).toEqual(VISITOR_PERMISSIONS)
  })

  it("deduplicates permissions across multiple roles", () => {
    const perms = getPermissions([ROLES.USER, ROLES.ADMIN])
    expect(new Set(perms).size).toBe(perms.length)
  })
})
