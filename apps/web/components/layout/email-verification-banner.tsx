import { IconMailQuestion } from "@tabler/icons-react"

interface EmailVerificationBannerProps {
  email: string
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  return (
    <div className="relative flex items-center justify-center gap-3 border-b bg-amber-50 px-10 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
      <IconMailQuestion size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
      <p>
        Verify your email address to unlock all features.{" "}
        <a
          href={`/verify-email?email=${encodeURIComponent(email)}`}
          className="font-semibold underline underline-offset-4 hover:text-amber-700 dark:hover:text-amber-100"
        >
          Resend verification email
        </a>
      </p>
    </div>
  )
}
