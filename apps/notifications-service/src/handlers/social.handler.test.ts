const mockCreate = jest.fn().mockResolvedValue(undefined)

jest.mock("../services/notification.service", () =>
  jest.fn().mockImplementation(() => ({ create: mockCreate }))
)

import { handleFollow } from "./social.handler"

beforeEach(() => jest.clearAllMocks())

describe("handleFollow", () => {
  it("creates follow notification for the followed user", async () => {
    await handleFollow({ followerId: "u1", followingId: "u2" })
    expect(mockCreate).toHaveBeenCalledWith({
      userId: "u2",
      type: "follow",
      payload: { actorId: "u1" },
    })
  })
})
