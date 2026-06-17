"use client"

import { useActionState } from "react"
import { useTranslations } from "next-intl"
import { useCooldown } from "@/hooks/use-cooldown"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupInput } from "@/components/ui/input-group"
import {
  twoFactorSendCodeAction,
  twoFactorEnableAction,
  twoFactorDisableAction,
} from "@/app/(app)/settings/actions"
import { IconShieldLockFilled } from "@tabler/icons-react"
import { useUserStore } from "@/stores/user-store"

export function SettingsTwoFactor() {
  const t = useTranslations("settings")
  const enabled = useUserStore((s) => s.user)?.twoFactorEnabled

  const [sendState, sendAction, sendPending] = useActionState(twoFactorSendCodeAction, null)
  const [enableState, enableAction, enablePending] = useActionState(twoFactorEnableAction, null)
  const [disableState, disableAction, disablePending] = useActionState(twoFactorDisableAction, null)
  const sendCooldown = useCooldown(sendState?.retryAfter, sendState)

  if (enabled) {
    return (
      <div className='rounded-2xl border border-border bg-background p-4'>
        <div className='mb-3'>
          <div className='flex items-center gap-2'>
            <IconShieldLockFilled className='h-5 w-5 shrink-0 text-muted-foreground' />
            <p className='text-sm font-semibold'>{t("2faTitle")}</p>
          </div>
          <p className='mt-0.5 text-xs text-muted-foreground'>{t("2faEnabledDesc")}</p>
        </div>
        <form action={disableAction}>
          {disableState?.error && (
            <div className='mb-2 text-xs text-destructive'>
              <p>{disableState.error}</p>
            </div>
          )}
          <Button type='submit' variant='destructive' size='lg' disabled={disablePending}>
            {disablePending ? t("2faDisabling") : t("2faDisable")}
          </Button>
        </form>
      </div>
    )
  }

  const codeSent = sendState?.sent

  return (
    <div className='rounded-2xl border border-border bg-background p-4'>
      <div className='mb-3'>
        <div className='flex items-center gap-2'>
          <IconShieldLockFilled className='h-5 w-5 shrink-0 text-muted-foreground' />
          <p className='text-sm font-semibold'>{t("2faTitle")}</p>
        </div>
        <p className='mt-0.5 text-xs text-muted-foreground'>{t("2faDesc")}</p>
      </div>

      {!codeSent ? (
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
              ? t("2faSending")
              : sendCooldown > 0
                ? t("2faTryAgain", { seconds: sendCooldown })
                : t("2faEnable")}
          </Button>
        </form>
      ) : (
        <form action={enableAction}>
          <FieldSet>
            <FieldGroup>
              <Field>
                <Label htmlFor='2fa-code'>{t("2faEnterCode")}</Label>
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
                <div className='text-xs text-destructive'>
                  <p>{enableState.error}</p>
                </div>
              )}
              <Field>
                <Button type='submit' size='lg' disabled={enablePending}>
                  {enablePending ? t("2faConfirming") : t("2faConfirm")}
                </Button>
              </Field>
            </FieldGroup>
          </FieldSet>
        </form>
      )}
    </div>
  )
}
