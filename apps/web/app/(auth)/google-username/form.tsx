"use client"

import { useActionState, useState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { IconAt } from "@tabler/icons-react"
import { googleUsernameAction } from "@/lib/actions/google-username"

interface GoogleUsernameFormProps {
  pendingToken: string
  displayName?: string
}

export function GoogleUsernameForm({ pendingToken, displayName }: GoogleUsernameFormProps) {
  const [username, setUsername] = useState("")
  const [state, action, isPending] = useActionState(googleUsernameAction, null)

  return (
    <div className='mx-auto flex w-full max-w-sm animate-in flex-col justify-center px-4 py-12 font-sans duration-300 select-none fade-in slide-in-from-bottom-4'>
      <div className='mb-8 text-center'>
        <h1 className='text-2xl font-semibold tracking-tight'>Choose your username</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          {displayName
            ? `Welcome, ${displayName}! Pick a username to finish setting up your account.`
            : "Pick a username to finish setting up your account."}
        </p>
      </div>

      <form action={action} className='flex w-full flex-col gap-4'>
        <input type='hidden' name='pendingToken' value={pendingToken} />
        <FieldSet>
          <FieldGroup>
            <Field>
              <Label htmlFor='username'>Username</Label>
              <InputGroup>
                <InputGroupInput
                  id='username'
                  name='username'
                  type='text'
                  placeholder='yourname'
                  autoComplete='username'
                  required
                  minLength={3}
                  maxLength={50}
                  pattern='[a-zA-Z0-9_]+'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <InputGroupAddon align='inline-start'>
                  <IconAt />
                </InputGroupAddon>
              </InputGroup>
            </Field>

            {state?.error && <p className='text-sm text-destructive'>{state.error}</p>}

            <Button type='submit' size='lg' disabled={isPending || username.length < 3}>
              {isPending ? "Setting up…" : "Continue"}
            </Button>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  )
}
