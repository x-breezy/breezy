"use client"

import { useTransition, useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { IconUserFilled } from "@tabler/icons-react"
import { useRouter } from "next/navigation"
import { setupProfileAction } from "@/app/(auth)/sign-up/actions"

interface WelcomeStepProps {
  avatar: File | null
  avatarPreview: string | null
  firstName: string
  lastName: string
  bio: string
}

export function WelcomeStep({ avatar, avatarPreview, firstName, lastName, bio }: WelcomeStepProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const displayName = [firstName, lastName].filter(Boolean).join(" ") || null

  function handleFinish() {
    startTransition(async () => {
      const fd = new FormData()
      if (avatar) fd.append("avatar", avatar)
      fd.append("firstName", firstName)
      fd.append("lastName", lastName)
      fd.append("bio", bio)
      const result = await setupProfileAction(null, fd)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push("/")
        router.refresh()
      }
    })
  }

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
            {displayName ? `Welcome to Breezy, ${displayName}` : "Welcome to Breezy"}
          </p>
          <p className='text-sm text-muted-foreground'>
            Your account is ready. Start exploring and share your world.
          </p>
        </div>
      </div>

      {error && <p className='text-sm text-destructive'>{error}</p>}

      <div className='flex w-full flex-col gap-2'>
        <Button size='lg' className='w-full' onClick={handleFinish} disabled={isPending}>
          {isPending ? "Setting up…" : "Get started"}
        </Button>
      </div>
    </div>
  )
}
