import ChatService from "../../services/message.service"
import { ConversationModel, MessageModel } from "../../models/message.model"

jest.mock("../../models/message.model", () => ({
  ConversationModel: {
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
  MessageModel: {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
    findOneAndDelete: jest.fn(),
  },
}))

const mockedConversation = ConversationModel as jest.Mocked<typeof ConversationModel>
const mockedMessage = MessageModel as jest.Mocked<typeof MessageModel>

const USER1_UUID = "11111111-1111-1111-1111-111111111111"
const USER2_UUID = "22222222-2222-2222-2222-222222222222"
const CONV_ID = "conv123"

describe("ChatService", () => {
  let service: ChatService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ChatService()
  })

  describe("getOrCreateConversation", () => {
    it("returns existing conversation if found", async () => {
      const mockConv = { id: CONV_ID }
      ;(mockedConversation.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockConv),
      })

      const result = await service.getOrCreateConversation(USER1_UUID, USER2_UUID)
      expect(result).toEqual(mockConv)
    })

    it("creates new conversation if not found", async () => {
      ;(mockedConversation.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })
      const mockConv = { id: CONV_ID }
      ;(mockedConversation.create as jest.Mock).mockResolvedValue(mockConv)

      const result = await service.getOrCreateConversation(USER1_UUID, USER2_UUID)
      expect(result).toEqual(mockConv)
      expect(mockedConversation.create).toHaveBeenCalled()
    })
  })

  describe("getConversations", () => {
    it("returns conversations sorted by lastMessageAt", async () => {
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ id: CONV_ID }]),
      }
      ;(mockedConversation.find as jest.Mock).mockReturnValue(mockQuery)

      const result = await service.getConversations(USER1_UUID)
      expect(result).toEqual([{ id: CONV_ID }])
      expect(mockedConversation.find).toHaveBeenCalledWith({ participantIds: USER1_UUID })
    })
  })

  describe("sendMessage", () => {
    it("creates a message and updates the conversation", async () => {
      const mockMsg = { id: "msg1", content: "hello" }
      ;(mockedMessage.create as jest.Mock).mockResolvedValue(mockMsg)
      ;(mockedConversation.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      })

      const result = await service.sendMessage(CONV_ID, USER1_UUID, "hello")
      expect(result).toEqual(mockMsg)
      expect(mockedMessage.create).toHaveBeenCalledWith({
        conversationId: CONV_ID,
        senderId: USER1_UUID,
        content: "hello",
      })
      expect(mockedConversation.findByIdAndUpdate).toHaveBeenCalled()
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
