"use client"

import { useActionState } from "react"
import { useSearchParams } from "next/navigation"
import { AuthHeader } from "@/components/auth/auth-header"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { twoFactorAction } from "./actions"

export default function TwoFactorPage() {
  const searchParams = useSearchParams()
  const pendingToken = searchParams.get("t") ?? ""
  const [state, action, isPending] = useActionState(twoFactorAction, null)

  return (
    <div className='mx-auto flex w-full max-w-sm animate-in flex-col justify-center px-4 py-12 font-sans duration-300 select-none fade-in slide-in-from-bottom-4'>
      <AuthHeader title='Two-factor verification' subtitle='Enter the code sent to your email' />

      <form action={action} className='flex w-full flex-col gap-4'>
        <input type='hidden' name='pendingToken' value={pendingToken} />
        <FieldSet>
          <FieldGroup>
            <Field>
              <Label htmlFor='code'>Verification code</Label>
              <InputGroup>
                <InputGroupInput
                  id='code'
                  name='code'
                  type='text'
                  inputMode='numeric'
                  maxLength={6}
                  placeholder='000000'
                  autoComplete='one-time-code'
                  required
                />
              </InputGroup>
            </Field>

            {state?.error && <p className='text-xs text-destructive'>{state.error}</p>}

            <Field>
              <Button type='submit' size='lg' disabled={isPending}>
                {isPending ? "Verifying…" : "Verify"}
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  )
}
