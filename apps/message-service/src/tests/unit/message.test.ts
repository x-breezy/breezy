import MessageService from "../../services/message.service"
import { MessageModel } from "../../models/message.model"
import { ConversationModel } from "../../models/conversation.model"

jest.mock("../../models/message.model", () => ({
  MessageModel: {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}))

jest.mock("../../models/conversation.model", () => ({
  ConversationModel: {
    findByIdAndUpdate: jest.fn(),
  },
}))

jest.mock("../../config/websocket", () => ({
  getIO: () => ({
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  }),
}))

const mockedMessage = jest.mocked(MessageModel)
const mockFindByIdAndUpdate = jest.mocked(ConversationModel.findByIdAndUpdate)

const USER1_UUID = "11111111-1111-1111-1111-111111111111"
const CONV_ID = "conv123"

describe("MessageService", () => {
  let service: MessageService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new MessageService()
  })

  describe("sendMessage", () => {
    it("creates a message and updates the conversation", async () => {
      const mockMsg = { id: "msg1", content: "hello" }
      ;(mockedMessage.create as jest.Mock).mockResolvedValue(mockMsg)
      mockFindByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ participantIds: [USER1_UUID] }),
      })

      const result = await service.sendMessage(CONV_ID, USER1_UUID, "hello")
      expect(result).toEqual(mockMsg)
      expect(mockedMessage.create).toHaveBeenCalledWith({
        conversationId: CONV_ID,
        senderId: USER1_UUID,
        content: "hello",
      })
      expect(mockFindByIdAndUpdate).toHaveBeenCalled()
    })
  })

  describe("getMessages", () => {
    it("returns paginated messages", async () => {
      const mockMsg = { id: "msg1" }
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockMsg]),
      }
      ;(mockedMessage.find as jest.Mock).mockReturnValue(mockQuery)
      ;(mockedMessage.countDocuments as jest.Mock).mockResolvedValue(1)

      const result = await service.getMessages(CONV_ID, 1, 20)
      expect(result).toEqual({ data: [mockMsg], total: 1, page: 1, limit: 20 })
    })
  })

  describe("markAsRead", () => {
    it("updates readAt for unread messages", async () => {
      ;(mockedMessage.updateMany as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })

      await service.markAsRead(CONV_ID, USER1_UUID)
      expect(mockedMessage.updateMany).toHaveBeenCalledWith(
        { conversationId: CONV_ID, senderId: { $ne: USER1_UUID }, readAt: null },
        { readAt: expect.any(Date) }
      )
    })
  })

  describe("deleteMessage", () => {
    it("returns true if message was deleted", async () => {
      ;(mockedMessage.findOneAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: "msg1" }),
      })

      const result = await service.deleteMessage("msg1", USER1_UUID)
      expect(result).toBe(true)
      expect(mockedMessage.findOneAndDelete).toHaveBeenCalledWith({
        _id: "msg1",
        senderId: USER1_UUID,
      })
    })

    it("returns false if message not found or not owned by user", async () => {
      ;(mockedMessage.findOneAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })

      const result = await service.deleteMessage("msg1", USER1_UUID)
      expect(result).toBe(false)
    })
  })
})
