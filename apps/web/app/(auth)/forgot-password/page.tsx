"use client"

import { useActionState } from "react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useCooldown } from "@/hooks/use-cooldown"
import { AuthHeader } from "@/components/auth/auth-header"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { IconMail } from "@tabler/icons-react"
import { forgotPasswordAction } from "./actions"

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState(forgotPasswordAction, null)
  const cooldown = useCooldown(state?.retryAfter, state)
  const t = useTranslations("auth")

  if (state?.sent) {
    return (
      <div className='mx-auto flex w-full max-w-sm animate-in flex-col justify-center px-4 py-12 text-center font-sans duration-300 select-none fade-in slide-in-from-bottom-4'>
        <AuthHeader title={t("checkYourEmail")} subtitle={t("resetLinkSent")} />
        <div className='mt-6 text-sm text-muted-foreground'>
          <Link href='/sign-in' className='font-semibold text-foreground underline'>
            {t("backToSignIn")}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='mx-auto flex w-full max-w-sm animate-in flex-col justify-center px-4 py-12 font-sans duration-300 select-none fade-in slide-in-from-bottom-4'>
      <AuthHeader title={t("forgotPasswordTitle")} subtitle={t("forgotSubtitle")} />

      <form action={action} className='flex w-full flex-col gap-4'>
        <FieldSet>
          <FieldGroup>
            <Field>
              <Label htmlFor='email'>{t("emailAddress")}</Label>
              <InputGroup>
                <InputGroupInput
                  id='email'
                  name='email'
                  type='email'
                  placeholder={t("emailPlaceholder")}
                  autoComplete='email'
                  required
                />
                <InputGroupAddon align='inline-start'>
                  <IconMail />
                </InputGroupAddon>
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
              <Button type='submit' size='lg' disabled={isPending || cooldown > 0}>
                {isPending
                  ? t("sending")
                  : cooldown > 0
                    ? t("tryAgainIn", { seconds: cooldown })
                    : t("sendResetLink")}
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>

      <div className='mt-6 text-center text-sm font-medium text-muted-foreground'>
        <Link href='/sign-in' className='font-semibold text-foreground underline'>
          {t("backToSignIn")}
        </Link>
      </div>
    </div>
  )
}
