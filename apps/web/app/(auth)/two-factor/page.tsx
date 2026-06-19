"use client"

import { useActionState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useCooldown } from "@/hooks/use-cooldown"
import { AuthHeader } from "@/components/auth/auth-header"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { resendTwoFactorCodeAction, twoFactorAction } from "@/lib/actions/two-factor"

export default function TwoFactorPage() {
  const searchParams = useSearchParams()
  const pendingToken = searchParams.get("t") ?? ""
  const [state, action, isPending] = useActionState(twoFactorAction, null)
  const [resendState, resendAction, resendPending] = useActionState(resendTwoFactorCodeAction, null)
  const resendCooldown = useCooldown(resendState?.retryAfter, resendState)
  const t = useTranslations("auth")

  if (!pendingToken) {
    return (
      <div className='mx-auto flex w-full max-w-sm animate-in flex-col justify-center px-4 py-12 text-center font-sans duration-300 select-none fade-in slide-in-from-bottom-4'>
        <AuthHeader title={t("twoFactorExpiredTitle")} subtitle={t("twoFactorExpiredDesc")} />
        <Link
          href='/sign-in'
          className='mt-6 inline-flex h-9 w-full items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80'
        >
          {t("backToSignIn")}
        </Link>
      </div>
    )
  }

  return (
    <div className='mx-auto flex w-full max-w-sm animate-in flex-col justify-center px-4 py-12 font-sans duration-300 select-none fade-in slide-in-from-bottom-4'>
      <AuthHeader title={t("twoFactorTitle")} subtitle={t("twoFactorSubtitle")} />

      <form action={action} className='flex w-full flex-col gap-4'>
        <input type='hidden' name='pendingToken' value={pendingToken} />
        <FieldSet>
          <FieldGroup>
            <Field>
              <Label htmlFor='code'>{t("verificationCode")}</Label>
              <InputGroup>
                <InputGroupInput
                  id='code'
                  name='code'
                  type='text'
                  inputMode='numeric'
                  maxLength={6}
                  placeholder={t("verificationCodePlaceholder")}
                  autoComplete='one-time-code'
                  required
                />
              </InputGroup>
            </Field>

            {state?.error && (
              <div className='text-xs text-destructive'>
                <p>{state.error}</p>
                {state.code && (
                  <p className='mt-1 text-muted-foreground'>
                    {t("codePrefix")}: {state.code}
                  </p>
                )}
              </div>
            )}

            <Field>
              <Button type='submit' size='lg' disabled={isPending}>
                {isPending ? t("twoFactorVerifying") : t("twoFactorVerifyBtn")}
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>

      <div className='mt-4 text-center text-sm text-muted-foreground'>
        {resendState?.success && <p>{t("twoFactorNewCodeSent")}</p>}
        {resendState?.error && (
          <div className='text-destructive'>
            <p>{resendState.error}</p>
            {resendState.code && (
              <p className='mt-1 text-xs text-muted-foreground'>
                {t("codePrefix")}: {resendState.code}
              </p>
            )}
          </div>
        )}
        <form action={resendAction} className='mt-3'>
          <input type='hidden' name='pendingToken' value={pendingToken} />
          <Button
            type='submit'
            variant='outline'
            size='sm'
            disabled={resendPending || resendCooldown > 0}
          >
            {resendPending
              ? t("sending")
              : resendCooldown > 0
                ? t("tryAgainIn", { seconds: resendCooldown })
                : t("twoFactorResendCode")}
          </Button>
        </form>
        <p className='mt-4'>
          <Link href='/sign-in' className='font-semibold text-foreground underline'>
            {t("backToSignIn")}
          </Link>
        </p>
      </div>
    </div>
  )
}
