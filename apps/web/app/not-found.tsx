"use client"

import { useTranslations } from "next-intl"

export default function ProfileNotFound() {
  const t = useTranslations("profilePage")

  return (
    <div className='flex flex-col items-center justify-center px-4 py-24 text-center'>
      <p className='text-lg font-medium text-foreground'>{t("unknownProfile")}</p>
      <p className='mt-2 text-sm text-muted-foreground'>
        {t("unknownProfileDesc")}{" "}
        <a href='/' className='font-medium text-foreground hover:underline'>
          {t("backToHome")}
        </a>
      </p>
    </div>
  )
}
