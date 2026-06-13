const mockCreateDeduped = jest.fn().mockResolvedValue(undefined)

jest.mock("../services/notification.service", () =>
  jest.fn().mockImplementation(() => ({ createDeduped: mockCreateDeduped }))
)

import { handleFollow } from "./social.handler"

beforeEach(() => jest.clearAllMocks())

describe("handleFollow", () => {
  it("creates follow notification for the followed user", async () => {
    await handleFollow({ followerId: "u1", followingId: "u2" })
    expect(mockCreateDeduped).toHaveBeenCalledWith(
      {
        userId: "u2",
        type: "follow",
        payload: { actorId: "u1", username: undefined, avatarId: undefined },
      },
      { "payload.actorId": "u1" }
    )
  })
})
