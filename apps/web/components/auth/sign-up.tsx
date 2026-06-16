"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { AuthHeader } from "./auth-header"
import { AccountStep } from "./onboarding/account-step"
import { PhotoStep } from "./onboarding/photo-step"
import { WelcomeStep } from "./onboarding/welcome-step"
import { cn } from "@/lib/utils"
import { setupProfileAction } from "@/app/(auth)/sign-up/actions"

type Step = 1 | 2 | 3

function StepIndicator({ current, t }: { current: Step; t: any }) {
  const STEPS: { label: string }[] = [
    { label: t("stepAccount") },
    { label: t("stepProfile") },
    { label: t("stepDone") },
  ]


  return (
    <div className='mb-8 flex items-center justify-center'>
      {STEPS.map((s, i) => {
        const num = (i + 1) as Step
        const isActive = num === current
        const isDone = num < current
        return (
          <div key={s.label} className='flex items-center'>
            <div className='flex flex-col items-center gap-1.5'>
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isDone
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? (
                  <svg width='12' height='12' viewBox='0 0 12 12' fill='none'>
                    <path
                      d='M2 6l3 3 5-5'
                      stroke='currentColor'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                ) : (
                  num
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mb-4 h-px w-12 transition-colors",
                  current > num ? "bg-primary/40" : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function SignUpScreen() {
  const t = useTranslations("auth")
  const STEP_META: Record<Step, { title: string; subtitle: string }> = {
    1: { title: t("createAccount"), subtitle: t("signUpToGetStarted") },
    2: { title: t("setUpProfile"), subtitle: t("addDetailsLater") },
    3: { title: t("allSet"), subtitle: t("accountReady") },
  }

  const [step, setStep] = useState<Step>(1)
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [bio, setBio] = useState("")

  function handleAvatarChange(file: File, preview: string) {
    setAvatar(file)
    setAvatarPreview(preview)
  }

  function handleFieldChange(field: "firstName" | "lastName" | "bio", value: string) {
    if (field === "firstName") setFirstName(value)
    else if (field === "lastName") setLastName(value)
    else setBio(value)
  }

  const { title, subtitle } = STEP_META[step]

  return (
    <div className='mx-auto flex w-full max-w-sm animate-in flex-col justify-center px-4 py-12 font-sans duration-300 select-none fade-in slide-in-from-bottom-4'>
      <AuthHeader title={title} subtitle={subtitle} />

      <StepIndicator current={step} t={t} />

      <div key={step} className='animate-in duration-200 fade-in slide-in-from-right-4'>
        {step === 1 && (
          <>
            <AccountStep onSuccess={() => setStep(2)} />
            <div className='mt-6 text-center text-sm font-medium text-muted-foreground'>
              {t("alreadyHaveAccount")}{" "}
              <Link href='/sign-in' className='font-semibold text-foreground underline'>
                {t("signIn")}
              </Link>
            </div>
          </>
        )}

        {step === 2 && (
          <PhotoStep
            preview={avatarPreview}
            onAvatarChange={handleAvatarChange}
            firstName={firstName}
            lastName={lastName}
            bio={bio}
            onChange={handleFieldChange}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <WelcomeStep
            avatar={avatar}
            avatarPreview={avatarPreview}
            firstName={firstName}
            lastName={lastName}
            bio={bio}
            setupAction={setupProfileAction}
          />
        )}
      </div>
    </div>
  )
}
