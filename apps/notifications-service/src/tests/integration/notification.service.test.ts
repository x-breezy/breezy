import NotificationService from "../../services/notification.service"

jest.mock("../../models/notification.model", () => ({
  NotificationModel: {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateMany: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}))

jest.mock("../../services/sse.service", () => ({
  sseService: { push: jest.fn() },
}))

import { NotificationModel } from "../../models/notification.model"
import { sseService } from "../../services/sse.service"

const mockModel = NotificationModel as jest.Mocked<typeof NotificationModel>
const mockSse = sseService as jest.Mocked<typeof sseService>

function chainable(returnValue: unknown) {
  const obj: Record<string, jest.Mock> = {}
  const methods = ["sort", "skip", "limit", "exec"]
  for (const m of methods) {
    obj[m] = jest.fn().mockReturnValue(obj)
  }
  obj["exec"] = jest.fn().mockResolvedValue(returnValue)
  return obj
}

const service = new NotificationService()

beforeEach(() => jest.clearAllMocks())

describe("NotificationService.create", () => {
  it("creates notification and pushes to SSE", async () => {
    const doc = { _id: "id1", userId: "u1", type: "follow", toJSON: () => ({ id: "id1" }) }
    mockModel.create.mockResolvedValue(doc as never)
    await service.create({ userId: "u1", type: "follow", payload: { actorId: "u2" } })
    expect(mockModel.create).toHaveBeenCalledWith({
      userId: "u1",
      type: "follow",
      payload: { actorId: "u2" },
    })
    expect(mockSse.push).toHaveBeenCalledWith("u1", { id: "id1" })
  })
})

describe("NotificationService.list", () => {
  it("returns paginated results without read filter", async () => {
    const docs = [{ id: "n1" }, { id: "n2" }]
    const chain = chainable(docs)
    mockModel.find.mockReturnValue(chain as never)
    mockModel.countDocuments.mockResolvedValue(2)

    const result = await service.list("u1", { page: 1, limit: 20 })

    expect(mockModel.find).toHaveBeenCalledWith(expect.objectContaining({ userId: "u1" }))
    expect(result).toEqual({ data: docs, total: 2, page: 1, limit: 20 })
  })

  it("applies read filter when provided", async () => {
    const chain = chainable([])
    mockModel.find.mockReturnValue(chain as never)
    mockModel.countDocuments.mockResolvedValue(0)

    await service.list("u1", { page: 2, limit: 10, read: false })

    expect(mockModel.find).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", read: false })
    )
  })

  it("skips correct number of documents for page > 1", async () => {
    const chain = chainable([])
    mockModel.find.mockReturnValue(chain as never)
    mockModel.countDocuments.mockResolvedValue(0)

    await service.list("u1", { page: 3, limit: 10 })

    expect(chain.skip).toHaveBeenCalledWith(20)
    expect(chain.limit).toHaveBeenCalledWith(10)
  })
})

describe("NotificationService.markRead", () => {
  it("returns true when notification found and updated", async () => {
    mockModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: "id1" }),
    } as never)
    const result = await service.markRead("id1", "u1")
    expect(result).toBe(true)
    expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "id1", userId: "u1" },
      { read: true }
    )
  })

  it("returns false when notification not found", async () => {
    mockModel.findOneAndUpdate.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) } as never)
    const result = await service.markRead("missing", "u1")
    expect(result).toBe(false)
  })
})

describe("NotificationService.markAllRead", () => {
  it("updates all unread notifications for user", async () => {
    mockModel.updateMany.mockReturnValue({ exec: jest.fn().mockResolvedValue({}) } as never)
    await service.markAllRead("u1")
    expect(mockModel.updateMany).toHaveBeenCalledWith({ userId: "u1", read: false }, { read: true })
  })
})

describe("NotificationService.remove", () => {
  it("returns true when notification deleted", async () => {
    mockModel.findOneAndDelete.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: "id1" }),
    } as never)
    const result = await service.remove("id1", "u1")
    expect(result).toBe(true)
    expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({ _id: "id1", userId: "u1" })
  })

  it("returns false when notification not found", async () => {
    mockModel.findOneAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) } as never)
    const result = await service.remove("missing", "u1")
    expect(result).toBe(false)
  })
})
