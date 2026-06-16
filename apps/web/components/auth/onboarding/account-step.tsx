"use client"

import { useActionState, useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { PasswordField, getStrength } from "../password-field"
import { ConfirmPasswordField } from "../confirm-password-field"
import { Field, FieldGroup, FieldSet } from "../../ui/field"
import { Label } from "../../ui/label"
import OAuthButtons from "../oauth-buttons"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../../ui/input-group"
import { IconAt, IconMail } from "@tabler/icons-react"
import Link from "next/link"
import { signUpAction } from "@/app/(auth)/sign-up/actions"
import { Checkbox } from "@/components/ui/checkbox"
import { FieldLabel } from "@/components/ui/field"

export function AccountStep({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const [state, action, isPending] = useActionState(signUpAction, null)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [termsError, setTermsError] = useState(false)
  const t = useTranslations("auth")

  useEffect(() => {
    if (state?.success) onSuccess()
  }, [state?.success, onSuccess])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (!termsAccepted) {
      event.preventDefault()
      setTermsError(true)
      return
    }
    if (getStrength(password) < 3) {
      event.preventDefault()
      setLocalError(t("weakPassword"))
      return
    }
    if (password !== confirmPassword) {
      event.preventDefault()
      setLocalError(t("passwordsMismatch"))
      return
    }
    setLocalError(null)
  }

  const error = localError ?? state?.error ?? null

  return (
    <form action={action} onSubmit={handleSubmit} className='flex w-full flex-col gap-4'>
      <FieldSet>
        <FieldGroup>
          <OAuthButtons status='register' />
          <Field>
            <Label htmlFor='username'>{t("username")}</Label>
            <InputGroup>
              <InputGroupInput
                id='username'
                name='username'
                type='text'
                placeholder={t("usernamePlaceholder")}
                autoComplete='username'
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <InputGroupAddon align='inline-start'>
                <IconAt />
              </InputGroupAddon>
            </InputGroup>
          </Field>

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <InputGroupAddon align='inline-start'>
                <IconMail />
              </InputGroupAddon>
            </InputGroup>
          </Field>

          <PasswordField
            id='signup-password'
            name='password'
            value={password}
            onChange={setPassword}
            showStrength
          />

          <ConfirmPasswordField
            value={confirmPassword}
            password={password}
            onChange={setConfirmPassword}
          />

          <FieldGroup className='mx-auto'>
            <Field orientation='horizontal'>
              <Checkbox
                id='terms-checkbox-basic'
                name='terms-checkbox-basic'
                checked={termsAccepted}
                onCheckedChange={(v) => {
                  setTermsAccepted(!!v)
                  setTermsError(false)
                }}
                className={termsError ? "border-destructive" : ""}
              />
              <FieldLabel htmlFor='terms-checkbox-basic' className='flex gap-1 whitespace-nowrap'>
                {t.rich("acceptTerms", {
                  link: (chunks) => (
                    <Link href='/terms' target='_blank' className='text-foreground underline'>
                      {chunks}
                    </Link>
                  ),
                })}
              </FieldLabel>
            </Field>
            {termsError && <p className='text-xs text-destructive'>{t("termsError")}</p>}
          </FieldGroup>

          {error && <p className='text-sm text-destructive'>{error}</p>}

          <Button type='submit' size='lg' disabled={isPending}>
            {isPending ? t("creatingAccount") : t("continue")}
          </Button>
        </FieldGroup>
      </FieldSet>
    </form>
  )
}
