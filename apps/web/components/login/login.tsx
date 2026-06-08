"use client"

import { useState } from "react"
import Link from "next/link"
import { AuthHeader } from "./components/AuthHeader"
import { Button } from "@breezy/ui/components/button"
import { Input } from "@breezy/ui/components/input"

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
  }

  return (
    <div className='mx-auto flex w-full max-w-sm flex-col justify-center px-4 py-12 font-sans select-none'>
      <AuthHeader title='Welcome to Breezy' subtitle='Log in to continue' />

      <form onSubmit={handleSubmit} className='flex w-full flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <label htmlFor='identifier' className='px-0.5 text-xs font-semibold text-foreground'>
            Email or username
          </label>
          <Input
            id='identifier'
            type='text'
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder='you@example.com'
            autoComplete='username'
            required
          />
        </div>

        <div className='flex flex-col gap-1'>
          <label htmlFor='password' className='px-0.5 text-xs font-semibold text-foreground'>
            Password
          </label>
          <Input
            id='password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder='••••••••'
            autoComplete='current-password'
            required
          />
        </div>

        {error && <p className='text-xs text-destructive'>{error}</p>}

        <Button type='submit' className='mt-2 w-full rounded-full' size='lg'>
          Log in
        </Button>
      </form>

      <div className='mt-6 text-center text-xs font-medium text-muted-foreground'>
        Don&apos;t have an account?{" "}
        <Link href='/signup' className='font-semibold text-foreground hover:underline'>
          Sign up
        </Link>
      </div>
    </div>
  )
}
