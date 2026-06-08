const mockSendEmailVerification = jest.fn().mockResolvedValue(undefined)
const mockSendForgotPassword = jest.fn().mockResolvedValue(undefined)
const mockSend2FACode = jest.fn().mockResolvedValue(undefined)

jest.mock("../services/email.service", () =>
  jest.fn().mockImplementation(() => ({
    sendEmailVerification: mockSendEmailVerification,
    sendForgotPassword: mockSendForgotPassword,
    send2FACode: mockSend2FACode,
  }))
)

import { handleEmailVerification, handleForgotPassword, handle2FA } from "./auth.handler"

beforeEach(() => jest.clearAllMocks())

describe("auth handlers", () => {
  it("handleEmailVerification delegates to EmailService", async () => {
    const payload = { userId: "u1", email: "a@b.com", token: "tok" }
    await handleEmailVerification(payload)
    expect(mockSendEmailVerification).toHaveBeenCalledWith(payload)
  })

  it("handleForgotPassword delegates to EmailService", async () => {
    const payload = { userId: "u1", email: "a@b.com", resetToken: "reset" }
    await handleForgotPassword(payload)
    expect(mockSendForgotPassword).toHaveBeenCalledWith(payload)
  })

  it("handle2FA delegates to EmailService", async () => {
    const payload = { userId: "u1", email: "a@b.com", code: "123456", expiresAt: "2026-06-08" }
    await handle2FA(payload)
    expect(mockSend2FACode).toHaveBeenCalledWith(payload)
  })
})
