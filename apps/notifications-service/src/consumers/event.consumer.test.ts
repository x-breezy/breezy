jest.mock("../handlers/auth.handler", () => ({
  handleEmailVerification: jest.fn().mockResolvedValue(undefined),
  handleForgotPassword: jest.fn().mockResolvedValue(undefined),
  handle2FA: jest.fn().mockResolvedValue(undefined),
}))

jest.mock("../handlers/social.handler", () => ({
  handleFollow: jest.fn().mockResolvedValue(undefined),
}))

jest.mock("../handlers/content.handler", () => ({
  handleLike: jest.fn().mockResolvedValue(undefined),
  handleMention: jest.fn().mockResolvedValue(undefined),
}))

jest.mock("@breezy/logger", () => ({
  createLogger: () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn() }),
}))

import { handleEvent } from "./event.consumer"
import { handleEmailVerification, handleForgotPassword, handle2FA } from "../handlers/auth.handler"
import { handleFollow } from "../handlers/social.handler"
import { handleLike, handleMention } from "../handlers/content.handler"

beforeEach(() => jest.clearAllMocks())

describe("handleEvent", () => {
  it("routes auth.email_verification to handleEmailVerification", async () => {
    const payload = { userId: "u1", email: "a@b.com", token: "tok" }
    await handleEvent("auth.email_verification", payload)
    expect(handleEmailVerification).toHaveBeenCalledWith(payload)
  })

  it("routes auth.forgot_password to handleForgotPassword", async () => {
    const payload = { userId: "u1", email: "a@b.com", resetToken: "reset" }
    await handleEvent("auth.forgot_password", payload)
    expect(handleForgotPassword).toHaveBeenCalledWith(payload)
  })

  it("routes auth.2fa_code to handle2FA", async () => {
    const payload = { userId: "u1", email: "a@b.com", code: "123456", expiresAt: "2026-06-08" }
    await handleEvent("auth.2fa_code", payload)
    expect(handle2FA).toHaveBeenCalledWith(payload)
  })

  it("routes social.follow to handleFollow", async () => {
    const payload = { followerId: "u1", followingId: "u2" }
    await handleEvent("social.follow", payload)
    expect(handleFollow).toHaveBeenCalledWith(payload)
  })

  it("routes content.like to handleLike", async () => {
    const payload = { actorId: "u1", targetUserId: "u2", postId: "p1" }
    await handleEvent("content.like", payload)
    expect(handleLike).toHaveBeenCalledWith(payload)
  })

  it("routes content.mention to handleMention", async () => {
    const payload = { actorId: "u1", targetUserId: "u2", postId: "p1" }
    await handleEvent("content.mention", payload)
    expect(handleMention).toHaveBeenCalledWith(payload)
  })

  it("silently skips unknown routing key", async () => {
    await expect(handleEvent("unknown.event", {})).resolves.toBeUndefined()
    expect(handleEmailVerification).not.toHaveBeenCalled()
    expect(handleLike).not.toHaveBeenCalled()
  })
})
