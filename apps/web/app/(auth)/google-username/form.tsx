"use client"

import { useActionState, useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { IconAt } from "@tabler/icons-react"
import { googleUsernameAction } from "@/lib/actions/google-username"
import { usernameSchema } from "@/lib/schemas/user-validation"

interface GoogleUsernameFormProps {
  pendingToken: string
  displayName?: string
}

export function GoogleUsernameForm({ pendingToken, displayName }: GoogleUsernameFormProps) {
  const [username, setUsername] = useState("")
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [state, action, isPending] = useActionState(googleUsernameAction, null)
  const t = useTranslations("auth")

  function validate(value: string) {
    const result = usernameSchema.safeParse(value)
    setUsernameError(result.success ? null : t(result.error.issues[0]!.message))
    return result.success
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!validate(username)) {
      e.preventDefault()
    }
  }

  return (
    <div className='mx-auto flex w-full max-w-sm animate-in flex-col justify-center px-4 py-12 font-sans duration-300 select-none fade-in slide-in-from-bottom-4'>
      <div className='mb-8 text-center'>
        <h1 className='text-2xl font-semibold tracking-tight'>{t("chooseUsername")}</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          {displayName ? t("welcomeName", { name: displayName }) : t("pickUsername")}
        </p>
      </div>

      <form action={action} onSubmit={handleSubmit} className='flex w-full flex-col gap-4'>
        <input type='hidden' name='pendingToken' value={pendingToken} />
        <FieldSet>
          <FieldGroup>
            <Field>
              <Label htmlFor='username'>{t("username")}</Label>
              <InputGroup>
                <InputGroupInput
                  id='username'
                  name='username'
                  type='text'
                  placeholder='yourname'
                  autoComplete='username'
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    if (usernameError) setUsernameError(null)
                  }}
                  onBlur={(e) => validate(e.target.value)}
                />
                <InputGroupAddon align='inline-start'>
                  <IconAt />
                </InputGroupAddon>
              </InputGroup>
              {usernameError && <p className='text-xs text-destructive'>{usernameError}</p>}
            </Field>

            {state?.error && <p className='text-sm text-destructive'>{state.error}</p>}

            <Button type='submit' size='lg' disabled={isPending}>
              {isPending ? t("settingUp") : t("continue")}
            </Button>
          </FieldGroup>
        </FieldSet>
      </form>
    </div>
  )
}
