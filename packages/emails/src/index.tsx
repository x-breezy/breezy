import React from "react"
import { render } from "@react-email/render"
import { VerificationEmail } from "./templates/verification-email"
import { OTPEmail } from "./templates/otp-email"
import { ResetPasswordEmail } from "./templates/reset-password-email"
import { ResetPasswordConfirmationEmail } from "./templates/reset-password-confirmation-email"

export { VerificationEmail, OTPEmail, ResetPasswordEmail, ResetPasswordConfirmationEmail }

interface NamedUser {
  name: string
}

/** Render the email-verification template to an HTML string. `url` is the full verification link. */
export function renderVerificationEmail(props: {
  url: string
  appUrl?: string
  user: NamedUser
}): Promise<string> {
  return render(<VerificationEmail {...props} />)
}

/** Render the 2FA one-time-code template to an HTML string. */
export function renderOTPEmail(props: {
  otp: string
  appUrl?: string
  user: NamedUser
}): Promise<string> {
  return render(<OTPEmail {...props} />)
}

/** Render the password-reset template to an HTML string. `url` is the full reset link. */
export function renderResetPasswordEmail(props: {
  url: string
  appUrl?: string
  user: NamedUser
}): Promise<string> {
  return render(<ResetPasswordEmail {...props} />)
}

/** Render the password-reset confirmation template to an HTML string. */
export function renderResetPasswordConfirmationEmail(props: {
  resetAt: string
  appUrl?: string
  user: NamedUser
}): Promise<string> {
  return render(<ResetPasswordConfirmationEmail {...props} />)
}
