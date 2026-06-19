"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { AuthHeader } from "./auth-header"
import { Button } from "@/components/ui/button"
import { Label } from "../ui/label"
import { Field, FieldGroup, FieldSet } from "../ui/field"
import OAuthButtons from "./oauth-buttons"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group"
import { IconAt, IconEye, IconEyeClosed, IconLock } from "@tabler/icons-react"
import { signInAction } from "@/lib/actions/sign-in"

export default function SignInScreen() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [state, action, isPending] = useActionState(signInAction, null)
  const t = useTranslations("auth")

  return (
    <div className='mx-auto flex w-full max-w-sm animate-in flex-col justify-center px-4 py-12 font-sans duration-300 select-none fade-in slide-in-from-bottom-4'>
      <AuthHeader title={t("welcome")} subtitle={t("loginToContinue")} />

      <form action={action} className='flex w-full flex-col gap-4'>
        <FieldSet>
          <FieldGroup>
            <OAuthButtons status='connect' />
            <Field>
              <Label htmlFor='identifier'>{t("emailOrUsername")}</Label>
              <InputGroup>
                <InputGroupInput
                  id='identifier'
                  name='identifier'
                  type='text'
                  value={identifier}
                  className='!bg-none'
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t("identifierPlaceholder")}
                  autoComplete='username'
                  required
                />
                <InputGroupAddon align='inline-start'>
                  <IconAt />
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <Label htmlFor='password'>{t("password")}</Label>
              <InputGroup>
                <InputGroupInput
                  id='password'
                  name='password'
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  autoComplete='current-password'
                  required
                />
                <InputGroupAddon align='inline-start'>
                  <IconLock />
                </InputGroupAddon>
                <InputGroupAddon
                  align='inline-end'
                  onClick={() => setPasswordVisible((v) => !v)}
                  className='cursor-pointer'
                >
                  {passwordVisible ? <IconEye /> : <IconEyeClosed />}
                </InputGroupAddon>
              </InputGroup>
            </Field>

            {state?.error && <p className='text-xs text-destructive'>{state.error}</p>}

            <Field>
              <Button type='submit' size='lg' disabled={isPending}>
                {isPending ? t("connecting") : t("connect")}
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>

      <div className='mt-4 text-center text-sm font-medium text-muted-foreground'>
        <Link href='/forgot-password' className='font-semibold text-foreground underline'>
          {t("forgotPassword")}
        </Link>
      </div>

      <div className='mt-4 text-center text-sm font-medium text-muted-foreground'>
        {t("noAccount")}{" "}
        <Link href='/sign-up' className='font-semibold text-foreground underline'>
          {t("signUp")}
        </Link>
      </div>
    </div>
  )
}
