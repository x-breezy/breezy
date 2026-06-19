"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { IconCamera, IconUpload } from "@tabler/icons-react"
import { AvatarCropper } from "@/components/shared/avatar-cropper"
import { nameFieldSchema, bioSchema } from "@/lib/schemas/user-validation"

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
  const [firstNameError, setFirstNameError] = useState<string | null>(null)
  const [lastNameError, setLastNameError] = useState<string | null>(null)
  const [bioError, setBioError] = useState<string | null>(null)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [cropFileUrl, setCropFileUrl] = useState<string | null>(null)
  const t = useTranslations("auth")

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCropFileUrl(URL.createObjectURL(file))
    setCropDialogOpen(true)
  }

  function handleCrop(file: File) {
    onAvatarChange(file, URL.createObjectURL(file))
  }

  function validateField(field: "firstName" | "lastName", value: string) {
    const result = nameFieldSchema.safeParse(value || null)
    const error = result.success ? null : t(result.error.issues[0]!.message)
    if (field === "firstName") setFirstNameError(error)
    else setLastNameError(error)
    return result.success
  }

  function validateBio(value: string): boolean {
    const result = bioSchema.safeParse(value || null)
    const error = result.success ? null : t(result.error.issues[0]!.message)
    setBioError(error)
    return result.success
  }

  function handleNext() {
    const firstNameOk = validateField("firstName", firstName)
    const lastNameOk = validateField("lastName", lastName)
    const bioOk = validateBio(bio)
    if (firstNameOk && lastNameOk && bioOk) onNext()
  }

  function handleFieldChange(field: "firstName" | "lastName" | "bio", value: string) {
    onChange(field, value)
    if (field === "firstName" && firstNameError) setFirstNameError(null)
    if (field === "lastName" && lastNameError) setLastNameError(null)
    if (field === "bio" && bioError) setBioError(null)
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

      <AvatarCropper
        open={cropDialogOpen}
        imageUrl={cropFileUrl ?? ""}
        onCrop={handleCrop}
        onClose={() => {
          setCropDialogOpen(false)
          URL.revokeObjectURL(cropFileUrl ?? "")
          setCropFileUrl(null)
        }}
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
                onChange={(e) => handleFieldChange("firstName", e.target.value)}
                onBlur={(e) => validateField("firstName", e.target.value)}
              />
              {firstNameError && <p className='text-xs text-destructive'>{firstNameError}</p>}
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
                onChange={(e) => handleFieldChange("lastName", e.target.value)}
                onBlur={(e) => validateField("lastName", e.target.value)}
              />
              {lastNameError && <p className='text-xs text-destructive'>{lastNameError}</p>}
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
              onBlur={(e) => validateBio(e.target.value)}
            />
            {bioError && <p className='text-xs text-destructive'>{bioError}</p>}
            <p className='text-right text-xs text-muted-foreground'>
              {bio.length}/200 · {(bio.match(/\n/g) || []).length + 1}/5
            </p>
          </Field>
        </FieldGroup>
      </FieldSet>

      <div className='flex flex-col gap-3'>
        <Button size='lg' onClick={handleNext}>
          {t("continue")}
        </Button>
      </div>
    </div>
  )
}
