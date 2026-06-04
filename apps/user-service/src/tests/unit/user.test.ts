import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { UserModel } from "../models/user.model"
import UserService from "../services/user.service"
import type { CreateUserInput, UpdateUserInput } from "../models/user.model"

let mongoServer: MongoMemoryServer
let userService: UserService

const mockUser: CreateUserInput = {
  username: "grod_aaron",
  email: "grod.aaron@gmail.com",
  passwordHash: "$2b$10$abcdefghijklmnopqrstuuVwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ12",
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
  userService = new UserService()
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

afterEach(async () => {
  await UserModel.deleteMany({})
})

// ─── addUser ────────────────────────────────────────────────────────────────

describe("UserService.addUser", () => {
  it("should create a user and return a document", async () => {
    const user = await userService.addUser(mockUser)

    expect(user._id).toBeDefined()
    expect(user.username).toBe("grod_aaron")
    expect(user.email).toBe("grod.aaron@gmail.com")
    expect(user.isVerified).toBe(false)
    expect(user.lastLoginAt).toBeUndefined()
  })

  it("should throw when email is duplicate", async () => {
    await userService.addUser(mockUser)
    await expect(userService.addUser(mockUser)).rejects.toThrow()
  })

  it("should throw when username is duplicate", async () => {
    await userService.addUser(mockUser)
    const duplicate = { ...mockUser, email: "other@gmail.com" }
    await expect(userService.addUser(duplicate)).rejects.toThrow()
  })

  it("should throw when required fields are missing", async () => {
    await expect(
      userService.addUser({ username: "", email: "", passwordHash: "" })
    ).rejects.toThrow()
  })
})

// ─── getUser ─────────────────────────────────────────────────────────────────

describe("UserService.getUser", () => {
  it("should return the user by id", async () => {
    const created = await userService.addUser(mockUser)
    const found = await userService.getUser(created._id.toString())

    expect(found).not.toBeNull()
    expect(found!.email).toBe("grod.aaron@gmail.com")
  })

  it("should not expose passwordHash", async () => {
    const created = await userService.addUser(mockUser)
    const found = await userService.getUser(created._id.toString())

    expect((found as any).passwordHash).toBeUndefined()
  })

  it("should return null for unknown id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const found = await userService.getUser(fakeId)

    expect(found).toBeNull()
  })
})

// ─── getUserByEmail ───────────────────────────────────────────────────────────

describe("UserService.getUserByEmail", () => {
  it("should return the user by email", async () => {
    await userService.addUser(mockUser)
    const found = await userService.getUserByEmail("grod.aaron@gmail.com")

    expect(found).not.toBeNull()
    expect(found!.username).toBe("grod_aaron")
  })

  it("should return null for unknown email", async () => {
    const found = await userService.getUserByEmail("unknown@gmail.com")
    expect(found).toBeNull()
  })
})

// ─── updateUser ──────────────────────────────────────────────────────────────

describe("UserService.updateUser", () => {
  it("should update allowed fields", async () => {
    const created = await userService.addUser(mockUser)
    const input: UpdateUserInput = { username: "aaron_updated", isVerified: true }
    const updated = await userService.updateUser(created._id.toString(), input)

    expect(updated).not.toBeNull()
    expect(updated!.username).toBe("aaron_updated")
    expect(updated!.isVerified).toBe(true)
  })

  it("should return null for unknown id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const updated = await userService.updateUser(fakeId, { username: "ghost" })

    expect(updated).toBeNull()
  })
})

// ─── deleteUser ──────────────────────────────────────────────────────────────

describe("UserService.deleteUser", () => {
  it("should delete an existing user and return true", async () => {
    const created = await userService.addUser(mockUser)
    const deleted = await userService.deleteUser(created._id.toString())

    expect(deleted).toBe(true)
    expect(await userService.getUser(created._id.toString())).toBeNull()
  })

  it("should return false for unknown id", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString()
    const deleted = await userService.deleteUser(fakeId)

    expect(deleted).toBe(false)
  })
})