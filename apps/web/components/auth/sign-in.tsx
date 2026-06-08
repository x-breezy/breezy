"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { AuthHeader } from "./auth-header"
import { Button } from "@/components/ui/button"
import { Label } from "../ui/label"
import { Field, FieldGroup, FieldSet } from "../ui/field"
import OAuthButtons from "./oauth-buttons"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group"
import { IconAt, IconEye, IconEyeClosed, IconLock } from "@tabler/icons-react"
import { signInAction } from "@/app/(auth)/sign-in/actions"

export default function SignInScreen() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [state, action, isPending] = useActionState(signInAction, null)

  return (
    <div className='mx-auto flex w-full max-w-sm flex-col justify-center px-4 py-12 font-sans select-none'>
      <AuthHeader title='Welcome to Breezy' subtitle='Log in to continue' />

      <form action={action} className='flex w-full flex-col gap-4'>
        <FieldSet>
          <FieldGroup>
            <OAuthButtons status='connect' />
            <Field>
              <Label htmlFor='identifier'>Email or username</Label>
              <InputGroup>
                <InputGroupInput
                  id='identifier'
                  name='identifier'
                  type='text'
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder='you@example.com or samaltman'
                  autoComplete='username'
                  required
                />
                <InputGroupAddon align='inline-start'>
                  <IconAt />
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <Label htmlFor='password'>Password</Label>
              <InputGroup>
                <InputGroupInput
                  id='password'
                  name='password'
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Enter your password'
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
                {isPending ? "Connecting…" : "Connect"}
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>

      <div className='mt-6 text-center text-sm font-medium text-muted-foreground'>
        Don&apos;t have an account?{" "}
        <Link href='/sign-up' className='font-semibold text-foreground underline'>
          Sign up
        </Link>
      </div>
    </div>
  )
}
