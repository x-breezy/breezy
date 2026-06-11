"use client"

import { useActionState } from "react"
import { useCooldown } from "@/hooks/use-cooldown"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import { sendVerificationEmailAction, verifyEmailTokenAction } from "@/app/(app)/settings/actions"
import { IconCheckFilled, IconMailFilled } from "@tabler/icons-react"
import { useUserStore } from "@/stores/user-store"

export function SettingsEmailVerification() {
  const enabled = useUserStore((s) => s.user)?.isEmailVerified

  const [sendState, sendAction, sendPending] = useActionState(sendVerificationEmailAction, null)
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyEmailTokenAction, null)
  const sendCooldown = useCooldown(sendState?.retryAfter, sendState)

  if (enabled) {
    return (
      <div className='rounded-2xl border border-border bg-background p-4'>
        <div>
          <div className='flex items-center gap-2'>
            <IconMailFilled className='h-5 w-5 shrink-0 text-muted-foreground' />
            <p className='text-sm font-semibold'>Email verified</p>
            <IconCheckFilled className='h-3 w-3 shrink-0 text-muted-foreground' />
          </div>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            Your email is currently verified on your account.
          </p>
        </div>
      </div>
    )
  }

  const emailSent = sendState?.sent

  return (
    <div className='rounded-2xl border border-border bg-background p-4'>
      <div className='mb-3'>
        <div className='flex items-center gap-2'>
          <IconMailFilled className='h-5 w-5 shrink-0 text-muted-foreground' />
          <p className='text-sm font-semibold'>Email verification</p>
        </div>
        <p className='mt-0.5 text-xs text-muted-foreground'>
          Verify your email to secure your account.
        </p>
      </div>

      {!emailSent ? (
        <form action={sendAction}>
          {sendState?.error && (
            <div className='mb-2 text-xs text-destructive'>
              <p>{sendState.error}</p>
            </div>
          )}
          <Button
            type='submit'
            variant='outline'
            size='lg'
            disabled={sendPending || sendCooldown > 0}
          >
            {sendPending
              ? "Sending…"
              : sendCooldown > 0
                ? `Try again in ${sendCooldown}s`
                : "Send verification email"}
          </Button>
        </form>
      ) : (
        <form action={verifyAction}>
          <FieldSet>
            <FieldGroup>
              <Field>
                <Label htmlFor='verify-token'>Paste the verification token from the email</Label>
                <InputGroup>
                  <InputGroupInput
                    id='verify-token'
                    name='token'
                    type='text'
                    placeholder='Paste token here'
                    required
                  />
                </InputGroup>
              </Field>
              {verifyState?.error && (
                <div className='text-xs text-destructive'>
                  <p>{verifyState.error}</p>
                </div>
              )}
              <Field>
                <Button type='submit' size='lg' disabled={verifyPending}>
                  {verifyPending ? "Verifying…" : "Verify email"}
                </Button>
              </Field>
            </FieldGroup>
          </FieldSet>
        </form>
      )}
    </div>
  )
}
