"use client"

import { useRef, useActionState, useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { IconCamera, IconUpload } from "@tabler/icons-react"
import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { useUserStore } from "@/stores/user-store"
import { updateProfileAction, type UpdateProfileState } from "@/app/(app)/profile/actions"
import type { Profile } from "@/types/profile"

interface ProfileEditScreenProps {
  profile: Profile
  onClose: () => void
}

export default function ProfileEditScreen({ profile, onClose }: ProfileEditScreenProps) {
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
  }, [state?.success])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const [profileId] = useState(profile.profileId)
  const [firstName, setFirstName] = useState(profile.firstName ?? "")
  const [lastName, setLastName] = useState(profile.lastName ?? "")
  const [bio, setBio] = useState(profile.bio ?? "")

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
  }

  return (
    <div className='flex w-full flex-col gap-6 bg-background p-4'>
      {/* Avatar */}
      <div className='flex flex-col items-center gap-2'>
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          className='group relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
          aria-label='Upload profile photo'
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
              <span className='text-[10px] font-medium'>Add photo</span>
            </span>
          )}
          <span className='absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100'>
            <IconUpload size={20} className='text-white' />
          </span>
        </button>
        <p className='text-xs text-muted-foreground'>Change photo</p>
      </div>

      <form action={formAction} className='flex flex-col gap-6'>
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
                <Label htmlFor='firstName'>First name</Label>
                <Input
                  id='firstName'
                  name='firstName'
                  type='text'
                  placeholder='Sam'
                  autoComplete='given-name'
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor='lastName'>Last name</Label>
                <Input
                  id='lastName'
                  name='lastName'
                  type='text'
                  placeholder='Altman'
                  autoComplete='family-name'
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Field>
            </div>

            <Field>
              <Label htmlFor='bio'>Bio</Label>
              <Textarea
                id='bio'
                name='bio'
                placeholder='Tell people a little about yourself…'
                rows={3}
                className='resize-none'
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        {state?.error && <p className='text-sm text-destructive'>{state.error}</p>}

        <div className='flex flex-col gap-3'>
          <Button type='submit' size='lg' disabled={isPending}>
            {isPending ? "Saving…" : "Save changes"}
          </Button>
          <Button type='button' variant='outline' size='lg' onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
