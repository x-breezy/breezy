import { getPermissions } from "../../services/permission.service"
import { PERMISSIONS } from "../../constants/permissions"
import { ROLES } from "../../constants/roles"
import { ROLE_PERMISSIONS, VISITOR_PERMISSIONS } from "../../constants/rbac"

describe("getPermissions", () => {
  it("grants user own-scoped post permissions but not any-scoped", () => {
    const perms = getPermissions([ROLES.USER])
    expect(perms).toContain(PERMISSIONS.POST_CREATE)
    expect(perms).toContain(PERMISSIONS.POST_DELETE_OWN)
    expect(perms).not.toContain(PERMISSIONS.POST_DELETE_ANY)
    expect(perms).not.toContain(PERMISSIONS.USER_BAN)
  })

  it("grants moderator cross-owner and moderation permissions", () => {
    const perms = getPermissions([ROLES.MODERATOR])
    expect(perms).toContain(PERMISSIONS.POST_DELETE_ANY)
    expect(perms).toContain(PERMISSIONS.COMMENT_DELETE_ANY)
    expect(perms).toContain(PERMISSIONS.USER_BAN)
    expect(perms).toContain(PERMISSIONS.REPORT_RESOLVE)
  })

  it("grants admin the full catalog (superset)", () => {
    const perms = getPermissions([ROLES.ADMIN])
    const all = Object.values(PERMISSIONS)
    for (const p of all) {
      expect(perms).toContain(p)
    }
    expect(perms).toHaveLength(all.length)
  })

  it("returns the visitor set for empty roles", () => {
    const perms = getPermissions([])
    expect(perms).toEqual(VISITOR_PERMISSIONS)
    expect(perms).toContain(PERMISSIONS.ACCOUNT_CREATE)
    expect(perms).toContain(PERMISSIONS.SETTINGS_THEME)
    expect(perms).not.toContain(PERMISSIONS.POST_CREATE)
  })

  it("returns the visitor set for unknown-only roles", () => {
    const perms = getPermissions(["ghost" as never])
    expect(perms).toEqual(VISITOR_PERMISSIONS)
  })

  it("deduplicates the union of multiple roles", () => {
    const perms = getPermissions([ROLES.USER, ROLES.MODERATOR])
    expect(new Set(perms).size).toBe(perms.length)
    // moderator is a superset of user, so union == moderator set
    expect(perms.sort()).toEqual([...ROLE_PERMISSIONS[ROLES.MODERATOR]].sort())
  })
})
