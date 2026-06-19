"use client"

import { Button } from "../ui/button"
import { Field } from "../ui/field"
import Image from "next/image"
import { useTranslations } from "next-intl"

interface OAuthButtonsProps {
  status: "connect" | "register"
}

export default function OAuthButtons({ status }: OAuthButtonsProps) {
  const t = useTranslations("auth")

  return (
    <Field>
      <Button
        variant='outline'
        size='lg'
        onClick={() => {
          window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost"}/api/auth/google`
        }}
      >
        <Image
          src='/assets/google-icon.svg'
          alt='Google icon'
          width={16}
          height={16}
          data-icon='inline-start'
        />
        {status === "connect" ? <>{t("connectGoogle")}</> : <>{t("signUpGoogle")}</>}
      </Button>
    </Field>
  )
}
