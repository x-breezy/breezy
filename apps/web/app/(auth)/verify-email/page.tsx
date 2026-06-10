"use client"

import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { useCooldown } from "@/hooks/use-cooldown"
import { AuthHeader } from "@/components/auth/auth-header"
import { Button } from "@/components/ui/button"
import { verifyEmailAction, resendVerificationAction } from "./actions"

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const email = searchParams.get("email") ?? ""
  const [state, action, isPending] = useActionState(verifyEmailAction, null)
  const [resendState, resendAction, resendPending] = useActionState(resendVerificationAction, null)
  const resendCooldown = useCooldown(resendState?.retryAfter, resendState)

  const hasToken = token.length > 0

  return (
    <div className='mx-auto flex w-full max-w-sm animate-in flex-col justify-center px-4 py-12 text-center font-sans duration-300 select-none fade-in slide-in-from-bottom-4'>
      <AuthHeader
        title='Verify your email'
        subtitle={
          hasToken
            ? "Click below to confirm your email address."
            : "Check your inbox for a verification link."
        }
      />

      {hasToken && (
        <form action={action} className='mt-6'>
          <input type='hidden' name='token' value={token} />
          {state?.error && (
            <div className='mb-4 text-sm text-destructive'>
              <p>{state.error}</p>
              {state.code && (
                <p className='mt-1 text-xs text-muted-foreground'>Code: {state.code}</p>
              )}
            </div>
          )}
          <Button type='submit' size='lg' disabled={isPending} className='w-full'>
            {isPending ? "Verifying…" : "Confirm email"}
          </Button>
        </form>
      )}

      {!hasToken && (
        <div className='mt-6'>
          <p className='text-sm text-muted-foreground'>
            Didn&apos;t receive an email? Check your spam folder or resend it.
          </p>
          {resendState?.success && (
            <p className='mt-3 text-sm text-muted-foreground'>
              If that account needs verification, a new email is on its way.
            </p>
          )}
          {resendState?.error && (
            <div className='mt-3 text-sm text-destructive'>
              <p>{resendState.error}</p>
              {resendState.code && (
                <p className='mt-1 text-xs text-muted-foreground'>Code: {resendState.code}</p>
              )}
            </div>
          )}
          <form action={resendAction} className='mt-4'>
            <input type='hidden' name='email' value={email} />
            <Button
              type='submit'
              variant='outline'
              size='lg'
              disabled={resendPending || resendCooldown > 0 || email.length === 0}
              className='w-full'
            >
              {resendPending
                ? "Sending…"
                : resendCooldown > 0
                  ? `Try again in ${resendCooldown}s`
                  : "Resend verification email"}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
