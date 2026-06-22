"use client"

import { useActionState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { IconUserFilled } from "@tabler/icons-react"

interface ActionState {
  error: string | null
  success?: boolean
}

interface WelcomeStepProps {
  avatar: File | null
  avatarPreview: string | null
  firstName: string
  lastName: string
  bio: string
  setupAction: (_prev: ActionState | null, formData: FormData) => Promise<ActionState>
}

export function WelcomeStep({
  avatar,
  avatarPreview,
  firstName,
  lastName,
  bio,
  setupAction,
}: WelcomeStepProps) {
  const [state, action, isPending] = useActionState(setupAction, null)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations("auth")

  const displayName = [firstName, lastName].filter(Boolean).join(" ") || null

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData()
    fd.set("firstName", firstName ?? "")
    fd.set("lastName", lastName ?? "")
    fd.set("bio", bio ?? "")
    if (avatar) fd.set("avatar", avatar)
    startTransition(() => {
      action(fd)
    })
  }

  useEffect(() => {
    if (!state?.success) return
    router.replace("/")
    router.refresh()
  }, [router, state?.success])

  const error = state?.error ?? null

  return (
    <div className='flex w-full animate-in flex-col items-center gap-10 text-center duration-500 fade-in slide-in-from-bottom-3'>
      <div className='flex flex-col items-center gap-5'>
        <Avatar className='size-20 rounded-2xl'>
          <AvatarImage src={avatarPreview ?? undefined} alt='Your avatar' />
          <AvatarFallback>
            <IconUserFilled size={32} className='text-muted-foreground' />
          </AvatarFallback>
        </Avatar>

        <div className='flex flex-col gap-1.5'>
          <p className='text-xl font-semibold tracking-tight text-foreground'>
            {displayName ? `${t("welcome")}, ${displayName}` : t("welcome")}
          </p>
          <p className='text-sm text-muted-foreground'>{t("accountReadyDesc")}</p>
        </div>
      </div>

      {error && <p className='text-sm text-destructive'>{t(error)}</p>}

      <form onSubmit={handleSubmit} className='flex w-full flex-col gap-2'>
        <Button size='lg' className='w-full' type='submit' disabled={isPending}>
          {isPending ? t("settingUp") : t("getStarted")}
        </Button>
      </form>
    </div>
  )
}
