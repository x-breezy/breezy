const mockCreate = jest.fn().mockResolvedValue(undefined)

jest.mock("../../services/notification.service", () =>
  jest.fn().mockImplementation(() => ({ create: mockCreate }))
)

import { handleLike, handleMention } from "../../handlers/content.handler"

beforeEach(() => jest.clearAllMocks())

describe("handleLike", () => {
  it("creates like notification for the post author", async () => {
    await handleLike({ actorId: "u1", targetUserId: "u2", postId: "p1" })
    expect(mockCreate).toHaveBeenCalledWith({
      userId: "u2",
      type: "like",
      payload: { actorId: "u1", postId: "p1" },
    })
  })
})

describe("handleMention", () => {
  it("creates mention notification with postId and no commentId", async () => {
    await handleMention({ actorId: "u1", targetUserId: "u2", postId: "p1" })
    expect(mockCreate).toHaveBeenCalledWith({
      userId: "u2",
      type: "mention",
      payload: { actorId: "u1", postId: "p1", commentId: undefined },
    })
  })

  it("creates mention notification with commentId when present", async () => {
    await handleMention({ actorId: "u1", targetUserId: "u2", postId: "p1", commentId: "c1" })
    expect(mockCreate).toHaveBeenCalledWith({
      userId: "u2",
      type: "mention",
      payload: { actorId: "u1", postId: "p1", commentId: "c1" },
    })
  })
})
