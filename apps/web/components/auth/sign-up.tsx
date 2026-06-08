"use client"

import { useState } from "react"
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

export default function SignUpScreen() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)

    if (getStrength(password) < 3) {
      setError("Please choose a stronger password.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
  }

  return (
    <div className='mx-auto flex w-full max-w-sm flex-col justify-center px-4 py-12 font-sans select-none'>
      <AuthHeader title='Create an account' subtitle='Sign up to get started' />

      <form onSubmit={handleSubmit} className='flex w-full flex-col gap-4'>
        <FieldSet>
          <FieldGroup>
            <OAuthButtons status='register' />
            <Field>
              <Label htmlFor='username'>Username</Label>
              <InputGroup>
                <InputGroupInput
                  id='username'
                  type='text'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

            <Button type='submit' size='lg'>
              Sign up
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
