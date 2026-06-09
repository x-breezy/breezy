"use client"

import { useActionState } from "react"
import Link from "next/link"
import { AuthHeader } from "@/components/auth/auth-header"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { IconMail } from "@tabler/icons-react"
import { forgotPasswordAction } from "./actions"

export default function ForgotPasswordPage() {
  const [state, action, isPending] = useActionState(forgotPasswordAction, null)

  if (state?.sent) {
    return (
      <div className='mx-auto flex w-full max-w-sm flex-col justify-center px-4 py-12 text-center font-sans select-none'>
        <AuthHeader
          title='Check your email'
          subtitle='A reset link has been sent if that account exists.'
        />
        <div className='mt-6 text-sm text-muted-foreground'>
          <Link href='/sign-in' className='font-semibold text-foreground underline'>
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='mx-auto flex w-full max-w-sm flex-col justify-center px-4 py-12 font-sans select-none'>
      <AuthHeader title='Forgot password' subtitle='Enter your email to receive a reset link' />

      <form action={action} className='flex w-full flex-col gap-4'>
        <FieldSet>
          <FieldGroup>
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

            {state?.error && <p className='text-xs text-destructive'>{state.error}</p>}

            <Field>
              <Button type='submit' size='lg' disabled={isPending}>
                {isPending ? "Sending…" : "Send reset link"}
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>

      <div className='mt-6 text-center text-sm font-medium text-muted-foreground'>
        <Link href='/sign-in' className='font-semibold text-foreground underline'>
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
