import { hashPassword, verifyPassword } from "../../utils/password.util"

describe("hashPassword", () => {
  it("produces a salt:hash string", async () => {
    const result = await hashPassword("securePass123")
    expect(result).toMatch(/^[a-f0-9]{32}:[a-f0-9]{128}$/)
  })

  it("produces different hashes for the same password (different salt)", async () => {
    const [a, b] = await Promise.all([hashPassword("samePass1"), hashPassword("samePass1")])
    expect(a).not.toBe(b)
  })
})

describe("verifyPassword", () => {
  it("returns true for correct password", async () => {
    const hash = await hashPassword("MyPass123")
    await expect(verifyPassword("MyPass123", hash)).resolves.toBe(true)
  })

  it("returns false for wrong password", async () => {
    const hash = await hashPassword("RealPass1")
    await expect(verifyPassword("WrongPass", hash)).resolves.toBe(false)
  })

  it("returns false for malformed stored hash", async () => {
    await expect(verifyPassword("anything", "not-a-hash")).resolves.toBe(false)
  })

  it("returns false for empty salt", async () => {
    await expect(verifyPassword("anything", ":hexhex")).resolves.toBe(false)
  })

  it("returns false for empty hash portion", async () => {
    await expect(verifyPassword("anything", "salthash:")).resolves.toBe(false)
  })
})
