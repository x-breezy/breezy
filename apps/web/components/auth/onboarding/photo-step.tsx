"use client"

import { useRef } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { IconCamera, IconUpload } from "@tabler/icons-react"

interface ProfileStepProps {
  preview: string | null
  onAvatarChange: (file: File, preview: string) => void
  firstName: string
  lastName: string
  bio: string
  onChange: (field: "firstName" | "lastName" | "bio", value: string) => void
  onNext: () => void
}

export function PhotoStep({
  preview,
  onAvatarChange,
  firstName,
  lastName,
  bio,
  onChange,
  onNext,
}: ProfileStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const t = useTranslations("auth")

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    onAvatarChange(file, URL.createObjectURL(file))
  }

  return (
    <div className='flex w-full flex-col gap-6'>
      <div className='flex flex-col items-center gap-3'>
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          className='group relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
          aria-label={t("uploadPhoto")}
        >
          {preview ? (
            <Image src={preview} alt='Avatar preview' fill className='object-cover' />
          ) : (
            <span className='flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground'>
              <IconCamera size={24} />
              <span className='text-[10px] font-medium'>{t("addPhoto")}</span>
            </span>
          )}
          <span className='absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
            <IconUpload size={20} className='text-white' />
          </span>
        </button>
        <p className='text-xs text-muted-foreground'>{t("optional")}</p>
      </div>

      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleFileChange}
      />

      <FieldSet>
        <FieldGroup>
          <div className='grid grid-cols-2 gap-3'>
            <Field>
              <Label htmlFor='firstName'>{t("firstName")}</Label>
              <Input
                id='firstName'
                type='text'
                placeholder={t("firstNamePlaceholder")}
                autoComplete='given-name'
                required
                value={firstName}
                onChange={(e) => onChange("firstName", e.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor='lastName'>{t("lastName")}</Label>
              <Input
                id='lastName'
                type='text'
                placeholder={t("lastNamePlaceholder")}
                autoComplete='family-name'
                required
                value={lastName}
                onChange={(e) => onChange("lastName", e.target.value)}
              />
            </Field>
          </div>

          <Field>
            <Label htmlFor='bio'>{t("bio")}</Label>
            <Textarea
              id='bio'
              placeholder={t("bioPlaceholder")}
              rows={3}
              className='resize-none'
              value={bio}
              onChange={(e) => onChange("bio", e.target.value)}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <div className='flex flex-col gap-3'>
        <Button size='lg' onClick={onNext} disabled={!firstName || !lastName}>
          {t("continue")}
        </Button>
      </div>
    </div>
  )
}
