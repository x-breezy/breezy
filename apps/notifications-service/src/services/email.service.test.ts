import nodemailer from "nodemailer"
import EmailService from "./email.service"

const mockSendMail = jest.fn().mockResolvedValue({})
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}))

const service = new EmailService()

beforeEach(() => jest.clearAllMocks())

describe("EmailService.sendEmailVerification", () => {
  it("sends email with verification token", async () => {
    await service.sendEmailVerification({ userId: "u1", email: "a@example.com", token: "tok123" })
    expect(mockSendMail).toHaveBeenCalledTimes(1)
    const call = mockSendMail.mock.calls[0][0]
    expect(call.to).toBe("a@example.com")
    expect(call.subject).toContain("Verify")
    expect(call.text).toContain("tok123")
    expect(call.html).toContain("tok123")
  })

  it("creates a new transport per call", async () => {
    await service.sendEmailVerification({ userId: "u1", email: "a@example.com", token: "t1" })
    await service.sendEmailVerification({ userId: "u2", email: "b@example.com", token: "t2" })
    expect(nodemailer.createTransport).toHaveBeenCalledTimes(2)
  })
})

describe("EmailService.sendForgotPassword", () => {
  it("sends reset email with reset token", async () => {
    await service.sendForgotPassword({ userId: "u1", email: "a@example.com", resetToken: "reset99" })
    const call = mockSendMail.mock.calls[0][0]
    expect(call.to).toBe("a@example.com")
    expect(call.subject).toContain("Reset")
    expect(call.text).toContain("reset99")
    expect(call.html).toContain("reset99")
  })
})

describe("EmailService.send2FACode", () => {
  it("sends 2FA code email with code and expiry", async () => {
    await service.send2FACode({
      userId: "u1",
      email: "a@example.com",
      code: "123456",
      expiresAt: "2026-06-08T12:00:00Z",
    })
    const call = mockSendMail.mock.calls[0][0]
    expect(call.to).toBe("a@example.com")
    expect(call.text).toContain("123456")
    expect(call.text).toContain("2026-06-08T12:00:00Z")
    expect(call.html).toContain("123456")
    expect(call.html).toContain("2026-06-08T12:00:00Z")
  })
})
