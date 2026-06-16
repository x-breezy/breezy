"use client"

import { useActionState } from "react"
import { IconMailQuestion } from "@tabler/icons-react"
import { useCooldown } from "@/hooks/use-cooldown"
import { resendVerificationAction } from "@/app/(auth)/verify-email/actions"
import { useTranslations } from "next-intl"

interface EmailVerificationBannerProps {
  email: string
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const t = useTranslations("auth")
  const [state, action, isPending] = useActionState(resendVerificationAction, null)
  const cooldown = useCooldown(state?.retryAfter, state)

  return (
    <div className='relative flex items-center justify-center gap-3 border-b bg-amber-50 px-10 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'>
      <IconMailQuestion size={16} className='shrink-0 text-amber-600 dark:text-amber-400' />
      <span>
        {state?.success ? (
          t("verifyEmailBannerSent")
        ) : (
          <>
            {t("verifyEmailBannerText")}{" "}
            <form action={action} className='inline'>
              <input type='hidden' name='email' value={email} />
              <button
                type='submit'
                disabled={isPending || cooldown > 0}
                className='font-semibold underline underline-offset-4 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:text-amber-100'
              >
                {isPending
                  ? t("verifyEmailBannerSending")
                  : cooldown > 0
                    ? t("verifyEmailBannerRetry", { seconds: cooldown })
                    : t("verifyEmailResendBtn")}
              </button>
            </form>
          </>
        )}
      </span>
    </div>
  )
}
