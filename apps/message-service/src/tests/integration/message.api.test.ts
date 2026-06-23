import request from "supertest"
import { createApp } from "../../app"
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
    findOne: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}))

const mockedMessage = jest.mocked(MessageModel)
const mockConversationFindOne = jest.mocked(ConversationModel.findOne)
const mockConversationFindByIdAndUpdate = jest.mocked(ConversationModel.findByIdAndUpdate)
const app = createApp()

const USER1_UUID = "11111111-1111-1111-1111-111111111111"
const USER2_UUID = "22222222-2222-2222-2222-222222222222"
const CONVERSATION_ID = "64f1a2b3c4d5e6f7a8b9c0d1"
describe("Message API", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("POST /conversations", () => {
    it("returns 400 if user messages themselves", async () => {
      const res = await request(app)
        .post("/conversations")
        .set("x-user-id", USER1_UUID)
        .send({ recipientId: USER1_UUID })
      expect(res.status).toBe(400)
    })

    it("creates or gets a conversation", async () => {
      const mockConv = { id: CONVERSATION_ID, participantIds: [USER1_UUID, USER2_UUID] }
      mockConversationFindOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockConv),
      })

      const res = await request(app)
        .post("/conversations")
        .set("x-user-id", USER1_UUID)
        .send({ recipientId: USER2_UUID })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toEqual(mockConv)
    })
  })

  describe("POST /conversations/:id/messages", () => {
    it("creates a message", async () => {
      const mockMsg = { id: "msg1", content: "hello" }
      ;(mockedMessage.create as jest.Mock).mockResolvedValue(mockMsg)
      mockConversationFindByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ participantIds: [USER1_UUID, USER2_UUID] }),
      })

      const res = await request(app)
        .post(`/conversations/${CONVERSATION_ID}/messages`)
        .set("x-user-id", USER1_UUID)
        .send({ content: "hello" })

      expect(res.status).toBe(201)
      expect(res.body.data).toEqual(mockMsg)
    })
  })
})
