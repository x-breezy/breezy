import { Button, Section, Text } from "react-email"
import { Layout } from "../layouts/layout"

interface ResetPasswordEmailProps {
  token: string
  appUrl?: string
  user: {
    name: string
  }
}

export function ResetPasswordEmail({ token, appUrl, user }: ResetPasswordEmailProps) {
  const previewMessage = "Reset your Breezy password."
  const baseUrl = (appUrl ?? "http://localhost:3000").replace(/\/$/, "")
  const resetUrl = `${baseUrl}/app/reset-password?token=${token}`

  return (
    <Layout previewMessage={previewMessage} appUrl={baseUrl}>
      <Section>
        <Text className='m-0 text-2xl font-bold text-foreground'>Reset your password</Text>
        <Text className='mt-3 mb-0 text-base leading-7 text-foreground'>
          Hi <span className='font-semibold'>{user.name}</span>, click the button below to reset
          your password and regain access to your account.
        </Text>
      </Section>

      <Section className='mt-7'>
        <Button
          href={resetUrl}
          className='rounded-full bg-primary px-4 py-2 text-center text-base text-primary-foreground'
        >
          Reset password
        </Button>
      </Section>

      <Section className='mt-6'>
        <Text className='m-0 text-sm leading-6 text-muted-foreground'>
          This link expires in 10 minutes.
        </Text>
        <Text className='m-0 mt-2 text-sm leading-6 text-muted-foreground'>
          If you did not request a password reset, you can safely ignore this email.
        </Text>
      </Section>
    </Layout>
  )
}

ResetPasswordEmail.PreviewProps = {
  token: "bc8fcea8-07ea-4321-884a-ce9f1a01a9e0",
  user: {
    name: "John Doe",
  },
}

export default ResetPasswordEmail
