"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthHeader } from "./auth-header"
import { PasswordField, getStrength } from "./password-field"
import { ConfirmPasswordField } from "./confirm-password-field"
import { Field, FieldGroup, FieldSet } from "../ui/field"
import { Label } from "../ui/label"
import OAuthButtons from "./oauth-buttons"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group"
import { IconAt, IconMail } from "@tabler/icons-react"
import { signUpAction } from "@/app/(auth)/sign-up/actions"

export default function SignUpScreen() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const [state, action, isPending] = useActionState(signUpAction, null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (getStrength(password) < 3) {
      event.preventDefault()
      setLocalError("Please choose a stronger password.")
      return
    }
    if (password !== confirmPassword) {
      event.preventDefault()
      setLocalError("Passwords do not match.")
      return
    }
    setLocalError(null)
  }

  const error = localError ?? state?.error ?? null

  return (
    <div className='mx-auto flex w-full max-w-sm flex-col justify-center px-4 py-12 font-sans select-none'>
      <AuthHeader title='Create an account' subtitle='Sign up to get started' />

      <form action={action} onSubmit={handleSubmit} className='flex w-full flex-col gap-4'>
        <FieldSet>
          <FieldGroup>
            <OAuthButtons status='register' />
            <Field>
              <Label htmlFor='username'>Username</Label>
              <InputGroup>
                <InputGroupInput
                  id='username'
                  name='username'
                  type='text'
                  placeholder='samaltman'
                  autoComplete='username'
                  required
                />
                <InputGroupAddon align='inline-start'>
                  <IconAt />
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <Label htmlFor='email'>Email address</Label>
              <InputGroup>
                <InputGroupInput
                  id='email'
                  name='email'
                  type='email'
                  placeholder='you@example.com'
                  autoComplete='email'
                  required
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

            {error && <p className='text-sm text-destructive'>{error}</p>}

            <Button type='submit' size='lg' disabled={isPending}>
              {isPending ? "Creating account…" : "Sign up"}
            </Button>
          </FieldGroup>
        </FieldSet>
      </form>

      <div className='mt-6 text-center text-sm font-medium text-muted-foreground'>
        Already have an account?{" "}
        <Link href='/sign-in' className='font-semibold text-foreground underline'>
          Sign in
        </Link>
      </div>
    </div>
  )
}
