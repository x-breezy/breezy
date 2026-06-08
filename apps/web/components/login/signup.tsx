"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@breezy/ui/components/button"
import { Input } from "@breezy/ui/components/input"
import { AuthHeader } from "./components/AuthHeader"
import { PasswordField, getStrength } from "./components/PasswordField"
import { ConfirmPasswordField } from "./components/ConfirmPasswordField"

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
        <div className='flex flex-col gap-1'>
          <label htmlFor='username' className='px-0.5 text-xs font-semibold text-foreground'>
            Username
          </label>
          <Input
            id='username'
            type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder='samaltman'
            autoComplete='username'
            required
          />
        </div>

        <div className='flex flex-col gap-1'>
          <label htmlFor='email' className='px-0.5 text-xs font-semibold text-foreground'>
            Email address
          </label>
          <Input
            id='email'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='you@example.com'
            autoComplete='email'
            required
          />
        </div>

        <PasswordField id='signup-password' value={password} onChange={setPassword} showStrength />

        <ConfirmPasswordField
          value={confirmPassword}
          password={password}
          onChange={setConfirmPassword}
        />

        {error && <p className='text-xs text-destructive'>{error}</p>}

        <Button type='submit' className='mt-2 w-full rounded-full' size='lg'>
          Sign up
        </Button>
      </form>

      <div className='mt-6 text-center text-xs font-medium text-muted-foreground'>
        Already have an account?{" "}
        <Link href='/login' className='font-semibold text-foreground hover:underline'>
          Log in
        </Link>
      </div>
    </div>
  )
}
