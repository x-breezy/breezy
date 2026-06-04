import { User } from "../../models/user.model"
import UserService from "../../services/user.service"
import type { CreateUserInput, UpdateUserInput } from "../../models/user.model"

jest.mock("../../models/user.model", () => ({
  User: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    destroy: jest.fn(),
  },
}))

const mockedUser = User as jest.Mocked<typeof User>

let userService: UserService

const NOW = new Date("2026-01-01T00:00:00.000Z")

const MOCK_USER = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  username: "grod_aaron",
  email: "grod.aaron@gmail.com",
  isVerified: false,
  createdAt: NOW,
  updatedAt: NOW,
  update: jest.fn(),
  toJSON: () => ({
    id: "550e8400-e29b-41d4-a716-446655440000",
    username: "grod_aaron",
    email: "grod.aaron@gmail.com",
    isVerified: false,
    createdAt: NOW,
    updatedAt: NOW,
  }),
}

const MOCK_INPUT: CreateUserInput = {
  username: "grod_aaron",
  email: "grod.aaron@gmail.com",
  passwordHash: "$2b$10$abcdefghijklmnopqrstuuVwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12",
}

beforeEach(() => {
  jest.clearAllMocks()
  userService = new UserService()
})

// ─── addUser ─────────────────────────────────────────────────────────────────

describe("UserService.addUser", () => {
  it("should create a user and return a document", async () => {
    ;(mockedUser.create as jest.Mock).mockResolvedValue(MOCK_USER)

    const user = await userService.addUser(MOCK_INPUT)

    expect(user.id).toBeDefined()
    expect(user.username).toBe("grod_aaron")
    expect(user.email).toBe("grod.aaron@gmail.com")
    expect(user.isVerified).toBe(false)
    expect(mockedUser.create).toHaveBeenCalledWith(MOCK_INPUT)
  })

  it("should throw when email is duplicate", async () => {
    ;(mockedUser.create as jest.Mock).mockRejectedValue(new Error("UniqueConstraintError"))

    await expect(userService.addUser(MOCK_INPUT)).rejects.toThrow()
  })

  it("should throw when username is duplicate", async () => {
    ;(mockedUser.create as jest.Mock).mockRejectedValue(new Error("UniqueConstraintError"))

    const duplicate = { ...MOCK_INPUT, email: "other@gmail.com" }
    await expect(userService.addUser(duplicate)).rejects.toThrow()
  })

  it("should throw when required fields are missing", async () => {
    ;(mockedUser.create as jest.Mock).mockRejectedValue(new Error("ValidationError"))

    await expect(
      userService.addUser({ username: "", email: "", passwordHash: "" })
    ).rejects.toThrow()
  })
})

// ─── getUser ─────────────────────────────────────────────────────────────────

describe("UserService.getUser", () => {
  it("should return the user by id", async () => {
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue(MOCK_USER)

    const found = await userService.getUser(MOCK_USER.id)

    expect(found).not.toBeNull()
    expect(found!.email).toBe("grod.aaron@gmail.com")
    expect(mockedUser.findByPk).toHaveBeenCalledWith(MOCK_USER.id)
  })

  it("should not expose passwordHash", async () => {
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue(MOCK_USER)

    const found = await userService.getUser(MOCK_USER.id)

    expect((found as any).passwordHash).toBeUndefined()
  })

  it("should return null for unknown id", async () => {
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue(null)

    const found = await userService.getUser("550e8400-e29b-41d4-a716-000000000000")

    expect(found).toBeNull()
  })
})

// ─── getUserByEmail ───────────────────────────────────────────────────────────

describe("UserService.getUserByEmail", () => {
  it("should return the user by email", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(MOCK_USER)

    const found = await userService.getUserByEmail("grod.aaron@gmail.com")

    expect(found).not.toBeNull()
    expect(found!.username).toBe("grod_aaron")
    expect(mockedUser.findOne).toHaveBeenCalledWith({ where: { email: "grod.aaron@gmail.com" } })
  })

  it("should return null for unknown email", async () => {
    ;(mockedUser.findOne as jest.Mock).mockResolvedValue(null)

    const found = await userService.getUserByEmail("unknown@gmail.com")

    expect(found).toBeNull()
  })
})

// ─── updateUser ──────────────────────────────────────────────────────────────

describe("UserService.updateUser", () => {
  it("should update allowed fields and return updated user", async () => {
    const updatedUser = {
      ...MOCK_USER,
      username: "aaron_updated",
      isVerified: true,
      toJSON: () => ({ ...MOCK_USER.toJSON(), username: "aaron_updated", isVerified: true }),
    }

    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue({
      ...MOCK_USER,
      update: jest.fn().mockResolvedValue(updatedUser),
    })

    const input: UpdateUserInput = { username: "aaron_updated", isVerified: true }
    const updated = await userService.updateUser(MOCK_USER.id, input)

    expect(updated).not.toBeNull()
    expect(updated!.username).toBe("aaron_updated")
    expect(updated!.isVerified).toBe(true)
  })

  it("should return null for unknown id", async () => {
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue(null)

    const updated = await userService.updateUser("550e8400-e29b-41d4-a716-000000000000", {
      username: "ghost",
    })

    expect(updated).toBeNull()
  })
})

// ─── deleteUser ──────────────────────────────────────────────────────────────

describe("UserService.deleteUser", () => {
  it("should delete an existing user and return true", async () => {
    ;(mockedUser.destroy as jest.Mock).mockResolvedValue(1)

    const deleted = await userService.deleteUser(MOCK_USER.id)

    expect(deleted).toBe(true)
    expect(mockedUser.destroy).toHaveBeenCalledWith({ where: { id: MOCK_USER.id } })
  })

  it("should return false for unknown id", async () => {
    ;(mockedUser.destroy as jest.Mock).mockResolvedValue(0)

    const deleted = await userService.deleteUser("550e8400-e29b-41d4-a716-000000000000")

    expect(deleted).toBe(false)
  })
})
