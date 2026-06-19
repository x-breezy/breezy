import { getElevatedRoleFromRoles } from "../../utils/role.util"
import { ROLES } from "../../constants/roles"

describe("getElevatedRoleFromRoles", () => {
  it("returns ADMIN when role array includes admin", () => {
    expect(getElevatedRoleFromRoles([ROLES.USER, ROLES.ADMIN])).toBe(ROLES.ADMIN)
  })

  it("returns MODERATOR when role includes moderator but not admin", () => {
    expect(getElevatedRoleFromRoles([ROLES.USER, ROLES.MODERATOR])).toBe(ROLES.MODERATOR)
  })

  it("returns USER when only user role present", () => {
    expect(getElevatedRoleFromRoles([ROLES.USER])).toBe(ROLES.USER)
  })

  it("handles empty array and returns USER", () => {
    expect(getElevatedRoleFromRoles([])).toBe(ROLES.USER)
  })
})
