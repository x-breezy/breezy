import nodemailer from "nodemailer"
import type {
  AuthEmailVerificationEvent,
  AuthForgotPasswordEvent,
  Auth2FAEvent,
} from "../types/events"

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: process.env.SMTP_PORT === "465",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  })
}

const FROM = process.env.SMTP_FROM ?? "Breezy <noreply@breezy.clementomnes.dev>"

class EmailService {
  async sendEmailVerification(event: AuthEmailVerificationEvent): Promise<void> {
    await createTransport().sendMail({
      from: FROM,
      to: event.email,
      subject: "Verify your Breezy account",
      text: `Verify your account: ${event.token}`,
      html: `<p>Use this token to verify your account: <strong>${event.token}</strong></p>`,
    })
  }

  async sendForgotPassword(event: AuthForgotPasswordEvent): Promise<void> {
    await createTransport().sendMail({
      from: FROM,
      to: event.email,
      subject: "Reset your Breezy password",
      text: `Reset token: ${event.resetToken}`,
      html: `<p>Use this token to reset your password: <strong>${event.resetToken}</strong></p>`,
    })
  }

  async send2FACode(event: Auth2FAEvent): Promise<void> {
    await createTransport().sendMail({
      from: FROM,
      to: event.email,
      subject: "Your Breezy 2FA code",
      text: `Your code: ${event.code} (expires at ${event.expiresAt})`,
      html: `<p>Your 2FA code: <strong>${event.code}</strong></p><p>Expires at: ${event.expiresAt}</p>`,
    })
  }
}

export default EmailService
