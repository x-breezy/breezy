import EmailService from "../services/email.service"
import type {
  AuthEmailVerificationEvent,
  AuthForgotPasswordEvent,
  Auth2FAEvent,
} from "../types/events"

const emailService = new EmailService()

export async function handleEmailVerification(payload: unknown): Promise<void> {
  await emailService.sendEmailVerification(payload as AuthEmailVerificationEvent)
}

export async function handleForgotPassword(payload: unknown): Promise<void> {
  await emailService.sendForgotPassword(payload as AuthForgotPasswordEvent)
}

export async function handle2FA(payload: unknown): Promise<void> {
  await emailService.send2FACode(payload as Auth2FAEvent)
}
