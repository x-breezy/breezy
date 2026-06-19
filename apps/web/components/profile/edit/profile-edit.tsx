"use client"

import { useRef, useActionState, useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { IconCamera, IconUpload } from "@tabler/icons-react"
import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { useUserStore } from "@/stores/user-store"
import { updateProfileAction, type UpdateProfileState } from "@/lib/actions/profile"
import type { Profile } from "@/types/profile"
import { nameFieldSchema, bioSchema } from "@/lib/schemas/user-validation"

interface ProfileEditScreenProps {
  profile: Profile
  onClose: () => void
}

export default function ProfileEditScreen({ profile, onClose }: ProfileEditScreenProps) {
  const t = useTranslations("profilePage")
  const [state, formAction, isPending] = useActionState<UpdateProfileState | null, FormData>(
    updateProfileAction,
    null
  )
  const setProfile = useUserStore((s) => s.setProfile)

  useEffect(() => {
    if (state?.success && state.profile) {
      setProfile(state.profile)
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const [profileId] = useState(profile.profileId)
  const [firstName, setFirstName] = useState(profile.firstName ?? "")
  const [lastName, setLastName] = useState(profile.lastName ?? "")
  const [bio, setBio] = useState(profile.bio ?? "")
  const [firstNameError, setFirstNameError] = useState<string | null>(null)
  const [lastNameError, setLastNameError] = useState<string | null>(null)
  const [bioError, setBioError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  function validateField(field: "firstName" | "lastName", value: string): boolean {
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const firstNameOk = validateField("firstName", firstName)
    const lastNameOk = validateField("lastName", lastName)
    const bioOk = validateBio(bio)
    if (!firstNameOk || !lastNameOk || !bioOk) {
      e.preventDefault()
    }
  }

  return (
    <div className='flex w-full flex-col gap-6 bg-background p-4'>
      {/* Avatar */}
      <div className='flex flex-col items-center gap-2'>
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          className='group relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
          aria-label={t("uploadPhoto")}
        >
          {preview ? (
            <Image src={preview} alt='Avatar preview' fill className='object-cover' />
          ) : profile.avatarId ? (
            <ProfileAvatar
              src={profile.avatarId}
              alt={profile.username}
              size='xl'
              className='h-full w-full rounded-full'
            />
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
        <p className='text-xs text-muted-foreground'>{t("changePhoto")}</p>
      </div>

      <form action={formAction} onSubmit={handleSubmit} className='flex flex-col gap-6'>
        <input type='hidden' name='profileId' value={profileId} />
        <input
          ref={fileInputRef}
          type='file'
          name='avatar'
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
                  name='firstName'
                  type='text'
                  placeholder={t("firstNamePlaceholder")}
                  autoComplete='given-name'
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value)
                    if (firstNameError) setFirstNameError(null)
                  }}
                  onBlur={(e) => validateField("firstName", e.target.value)}
                />
                {firstNameError && <p className='text-xs text-destructive'>{firstNameError}</p>}
              </Field>
              <Field>
                <Label htmlFor='lastName'>{t("lastName")}</Label>
                <Input
                  id='lastName'
                  name='lastName'
                  type='text'
                  placeholder={t("lastNamePlaceholder")}
                  autoComplete='family-name'
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value)
                    if (lastNameError) setLastNameError(null)
                  }}
                  onBlur={(e) => validateField("lastName", e.target.value)}
                />
                {lastNameError && <p className='text-xs text-destructive'>{lastNameError}</p>}
              </Field>
            </div>

            <Field>
              <Label htmlFor='bio'>{t("bio")}</Label>
              <Textarea
                id='bio'
                name='bio'
                placeholder={t("bioPlaceholder")}
                rows={3}
                className='resize-none'
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value)
                  if (bioError) setBioError(null)
                }}
                onBlur={(e) => validateBio(e.target.value)}
              />
              {bioError && <p className='text-xs text-destructive'>{bioError}</p>}
              <p className='text-right text-xs text-muted-foreground'>
                {bio.length}/200 · {(bio.match(/\n/g) || []).length + 1}/5
              </p>
            </Field>
          </FieldGroup>
        </FieldSet>

        {state?.error && <p className='text-sm text-destructive'>{t(state.error)}</p>}

        <div className='flex flex-col gap-3'>
          <Button type='submit' size='lg' disabled={isPending}>
            {isPending ? t("saving") : t("saveChanges")}
          </Button>
          <Button type='button' variant='outline' size='lg' onClick={onClose}>
            {t("cancel")}
          </Button>
        </div>
      </form>
    </div>
  )
}
