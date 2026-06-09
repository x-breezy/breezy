"use client"

import { useActionState, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AuthHeader } from "@/components/auth/auth-header"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { PasswordField, getStrength } from "@/components/auth/password-field"
import { ConfirmPasswordField } from "@/components/auth/confirm-password-field"
import { resetPasswordAction } from "./actions"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const [state, action, isPending] = useActionState(resetPasswordAction, null)

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

  if (!token) {
    return (
      <div className='mx-auto flex w-full max-w-sm animate-in flex-col justify-center px-4 py-12 text-center font-sans duration-300 select-none fade-in slide-in-from-bottom-4'>
        <AuthHeader title='Invalid link' subtitle='This reset link is missing or malformed.' />
      </div>
    )
  }

  return (
    <div className='mx-auto flex w-full max-w-sm animate-in flex-col justify-center px-4 py-12 font-sans duration-300 select-none fade-in slide-in-from-bottom-4'>
      <AuthHeader title='Reset password' subtitle='Choose a new password for your account' />

      <form action={action} onSubmit={handleSubmit} className='flex w-full flex-col gap-4'>
        <input type='hidden' name='token' value={token} />
        <FieldSet>
          <FieldGroup>
            <PasswordField
              id='new-password'
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

            <Field>
              <Button type='submit' size='lg' disabled={isPending}>
                {isPending ? "Resetting…" : "Reset password"}
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  )
}
