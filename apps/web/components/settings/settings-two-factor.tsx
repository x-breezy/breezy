"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import {
  twoFactorSendCodeAction,
  twoFactorEnableAction,
  twoFactorDisableAction,
} from "@/app/(app)/settings/actions"

interface SettingsTwoFactorProps {
  enabled: boolean
}

export function SettingsTwoFactor({ enabled }: SettingsTwoFactorProps) {
  const [sendState, sendAction, sendPending] = useActionState(twoFactorSendCodeAction, null)
  const [enableState, enableAction, enablePending] = useActionState(twoFactorEnableAction, null)
  const [disableState, disableAction, disablePending] = useActionState(twoFactorDisableAction, null)

  if (enabled) {
    return (
      <div className='rounded-2xl border border-border bg-background p-4'>
        <div className='mb-3'>
          <p className='text-sm font-semibold'>Two-factor authentication</p>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            2FA is currently enabled on your account.
          </p>
        </div>
        <form action={disableAction}>
          {disableState?.error && (
            <p className='mb-2 text-xs text-destructive'>{disableState.error}</p>
          )}
          <Button type='submit' variant='destructive' size='sm' disabled={disablePending}>
            {disablePending ? "Disabling…" : "Disable 2FA"}
          </Button>
        </form>
      </div>
    )
  }

  const codeSent = sendState?.sent

  return (
    <div className='rounded-2xl border border-border bg-background p-4'>
      <div className='mb-3'>
        <p className='text-sm font-semibold'>Two-factor authentication</p>
        <p className='mt-0.5 text-xs text-muted-foreground'>
          Add an extra layer of security to your account.
        </p>
      </div>

      {!codeSent ? (
        <form action={sendAction}>
          {sendState?.error && <p className='mb-2 text-xs text-destructive'>{sendState.error}</p>}
          <Button type='submit' variant='outline' size='sm' disabled={sendPending}>
            {sendPending ? "Sending…" : "Enable 2FA"}
          </Button>
        </form>
      ) : (
        <form action={enableAction}>
          <FieldSet>
            <FieldGroup>
              <Field>
                <Label htmlFor='2fa-code'>Enter the code sent to your email</Label>
                <InputGroup>
                  <InputGroupInput
                    id='2fa-code'
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
              {enableState?.error && (
                <p className='text-xs text-destructive'>{enableState.error}</p>
              )}
              <Field>
                <Button type='submit' size='sm' disabled={enablePending}>
                  {enablePending ? "Confirming…" : "Confirm"}
                </Button>
              </Field>
            </FieldGroup>
          </FieldSet>
        </form>
      )}
    </div>
  )
}
