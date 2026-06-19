import React from "react"
import { Section, Text } from "react-email"
import { Layout } from "../layouts/layout"

interface ResetPasswordConfirmationEmailProps {
  resetAt: string
  appUrl?: string
  user: {
    name: string
  }
}

function formatResetAt(isoString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(isoString))
}

export function ResetPasswordConfirmationEmail({
  resetAt,
  appUrl,
  user,
}: ResetPasswordConfirmationEmailProps) {
  const formattedDate = formatResetAt(resetAt)
  const previewMessage = "Your Breezy password was successfully changed."
  const baseUrl = (appUrl ?? "http://localhost:3000").replace(/\/$/, "")

  return (
    <Layout previewMessage={previewMessage} appUrl={baseUrl}>
      <Section>
        <Text className='m-0 text-2xl font-bold text-foreground'>Password changed</Text>
        <Text className='mt-3 mb-0 text-base leading-7 text-foreground'>
          Hi <span className='font-semibold'>{user.name}</span>, your Breezy password was
          successfully reset on <span className='font-semibold'>{formattedDate} UTC</span>.
        </Text>
      </Section>

      <Section className='mt-6'>
        <Text className='m-0 text-sm leading-6 text-muted-foreground'>
          If you made this change, no further action is needed.
        </Text>
        <Text className='m-0 mt-2 text-sm leading-6 text-muted-foreground'>
          If you did not reset your password, contact our support team immediately and secure your
          account.
        </Text>
      </Section>
    </Layout>
  )
}

ResetPasswordConfirmationEmail.PreviewProps = {
  resetAt: "2026-05-30T14:32:00.000Z",
  user: {
    name: "John Doe",
  },
}

export default ResetPasswordConfirmationEmail
