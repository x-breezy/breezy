import nodemailer from "nodemailer"
import { renderVerificationEmail, renderOTPEmail, renderResetPasswordEmail } from "@breezy/emails"
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
const APP_URL = process.env.APP_URL ?? "http://localhost:3000"

/** Best-effort display name: explicit username, else the local-part of the email. */
function displayName(event: { username?: string; email: string }): string {
  return event.username ?? event.email.split("@")[0] ?? "there"
}

class EmailService {
  async sendEmailVerification(event: AuthEmailVerificationEvent): Promise<void> {
    const url = event.verifyUrl ?? `${APP_URL}/verify-email?token=${event.token}`
    const html = await renderVerificationEmail({
      url,
      appUrl: APP_URL,
      user: { name: displayName(event) },
    })
    await createTransport().sendMail({
      from: FROM,
      to: event.email,
      subject: "Verify your Breezy account",
      html,
    })
  }

  async sendForgotPassword(event: AuthForgotPasswordEvent): Promise<void> {
    const url = event.resetUrl ?? `${APP_URL}/reset-password?token=${event.resetToken}`
    const html = await renderResetPasswordEmail({
      url,
      appUrl: APP_URL,
      user: { name: displayName(event) },
    })
    await createTransport().sendMail({
      from: FROM,
      to: event.email,
      subject: "Reset your Breezy password",
      html,
    })
  }

  async send2FACode(event: Auth2FAEvent): Promise<void> {
    const html = await renderOTPEmail({
      otp: event.code,
      appUrl: APP_URL,
      user: { name: displayName(event) },
    })
    await createTransport().sendMail({
      from: FROM,
      to: event.email,
      subject: "Your Breezy 2FA code",
      html,
    })
  }
}

export default EmailService
