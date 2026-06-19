import UserService from "../../services/user.service"
import { User } from "../../models/user.model"
import { hashPassword, verifyPassword } from "../../utils/password.util"

jest.mock("../../models/user.model", () => ({
  User: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    count: jest.fn(),
  },
}))

jest.mock("../../utils/password.util", () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}))

let mockRedis: Record<string, jest.Mock>
let mockMulti: Record<string, jest.Mock>

jest.mock("../../clients/redis", () => ({
  getRedis: jest.fn(() => mockRedis),
}))

let service: UserService

beforeEach(() => {
  jest.clearAllMocks()
  service = new UserService()
  mockMulti = {
    del: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([]),
  }
  mockRedis = {
    multi: jest.fn().mockReturnValue(mockMulti),
    smembers: jest.fn().mockResolvedValue([]),
  }
})

const mockedUser = User as jest.Mocked<typeof User>
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>
const mockedVerifyPassword = verifyPassword as jest.MockedFunction<typeof verifyPassword>

const MOCK_USER = {
  id: "user-1",
  username: "alice",
  email: "alice@example.com",
  passwordHash: "salt:hash",
  role: "user",
  isBanned: false,
  isSuspended: false,
  isEmailVerified: false,
  twoFactorEnabled: false,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  toJSON: function () {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      role: this.role,
      isBanned: this.isBanned,
      isSuspended: this.isSuspended,
      isEmailVerified: this.isEmailVerified,
      twoFactorEnabled: this.twoFactorEnabled,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  },
}

describe("addUser", () => {
  it("creates user with hashed password and returns safe user", async () => {
    mockedHashPassword.mockResolvedValue("salthash:derivedkey")
    ;(mockedUser.create as jest.Mock).mockResolvedValue(MOCK_USER)

    const result = await service.addUser({
      username: "alice",
      email: "a@b.com",
      password: "Pass1234",
    })

    expect(mockedHashPassword).toHaveBeenCalledWith("Pass1234")
    expect(mockedUser.create).toHaveBeenCalledWith({
      username: "alice",
      email: "a@b.com",
      passwordHash: "salthash:derivedkey",
    })
    expect(result).not.toHaveProperty("passwordHash")
    expect(result).toMatchObject({ id: "user-1", username: "alice", email: "alice@example.com" })
  })
})

describe("getUser", () => {
  it("returns user JSON when found", async () => {
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue(MOCK_USER)

    const result = await service.getUser("user-1")

    expect(mockedUser.findByPk).toHaveBeenCalledWith("user-1")
    expect(result).toMatchObject({ id: "user-1", username: "alice" })
  })

  it("returns null when not found", async () => {
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue(null)

    expect(await service.getUser("missing")).toBeNull()
  })
})

describe("isEmailAndUsernameTaken", () => {
  it("reports both taken", async () => {
    ;(mockedUser.count as jest.Mock).mockResolvedValueOnce(1).mockResolvedValueOnce(1)

    const result = await service.isEmailAndUsernameTaken("a@b.com", "alice")

    expect(result).toEqual({ emailTaken: true, usernameTaken: true })
  })

  it("reports none taken", async () => {
    ;(mockedUser.count as jest.Mock).mockResolvedValueOnce(0).mockResolvedValueOnce(0)

    const result = await service.isEmailAndUsernameTaken("new@b.com", "newguy")

    expect(result).toEqual({ emailTaken: false, usernameTaken: false })
  })
})

describe("banUser", () => {
  it("bans user and revokes sessions", async () => {
    const updateMock = jest.fn().mockResolvedValue(undefined)
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue({ ...MOCK_USER, update: updateMock })
    mockRedis.smembers.mockResolvedValue(["h1"])

    await service.banUser("user-1")

    expect(updateMock).toHaveBeenCalledWith({ isBanned: true })
    expect(mockRedis.smembers).toHaveBeenCalledWith("session:user-1")
  })

  it("throws USER_NOT_FOUND when user does not exist", async () => {
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue(null)

    await expect(service.banUser("missing")).rejects.toMatchObject({ code: "USER_NOT_FOUND" })
  })
})

describe("suspendUser", () => {
  it("suspends user and revokes sessions", async () => {
    const updateMock = jest.fn().mockResolvedValue(undefined)
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue({ ...MOCK_USER, update: updateMock })
    mockRedis.smembers.mockResolvedValue(["h1"])

    await service.suspendUser("user-1")

    expect(updateMock).toHaveBeenCalledWith({ isSuspended: true })
  })
})

describe("searchByUsername", () => {
  it("returns matching users", async () => {
    ;(mockedUser.findAndCountAll as jest.Mock).mockResolvedValue({
      count: 1,
      rows: [{ id: "user-1", username: "alice" }],
    })

    const result = await service.searchByUsername("ali", 1, 20)

    expect(mockedUser.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ username: expect.any(Object) }),
      })
    )
    expect(result).toEqual({ count: 1, users: [{ id: "user-1", username: "alice" }] })
  })

  it("returns empty when no match", async () => {
    ;(mockedUser.findAndCountAll as jest.Mock).mockResolvedValue({ count: 0, rows: [] })

    const result = await service.searchByUsername("zzz", 1, 20)

    expect(result).toEqual({ count: 0, users: [] })
  })
})

describe("updatePassword", () => {
  it("updates password when current is correct", async () => {
    const updateMock = jest.fn().mockResolvedValue(undefined)
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue({
      id: "user-1",
      passwordHash: "salt:oldhash",
      update: updateMock,
    })
    mockedVerifyPassword.mockResolvedValue(true)
    mockedHashPassword.mockResolvedValue("salt:newhash")

    await service.updatePassword("user-1", "OldPass1", "NewPass1")

    expect(mockedVerifyPassword).toHaveBeenCalledWith("OldPass1", "salt:oldhash")
    expect(mockedHashPassword).toHaveBeenCalledWith("NewPass1")
    expect(updateMock).toHaveBeenCalledWith({ passwordHash: "salt:newhash" })
  })

  it("throws INVALID_PASSWORD when current is wrong", async () => {
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue({
      id: "user-1",
      passwordHash: "salt:oldhash",
      update: jest.fn(),
    })
    mockedVerifyPassword.mockResolvedValue(false)

    await expect(service.updatePassword("user-1", "WrongPass", "NewPass1")).rejects.toMatchObject({
      code: "INVALID_PASSWORD",
    })
  })

  it("throws USER_NOT_FOUND when user does not exist", async () => {
    ;(mockedUser.findByPk as jest.Mock).mockResolvedValue(null)

    await expect(service.updatePassword("missing", "OldPass1", "NewPass1")).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
    })
  })
})
