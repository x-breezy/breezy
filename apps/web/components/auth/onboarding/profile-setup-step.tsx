"use client"

import { useActionState, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { IconCamera } from "@tabler/icons-react"
import { setupProfileAction } from "@/app/(auth)/sign-up/actions"

export function ProfileSetupStep() {
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [state, action, isPending] = useActionState(setupProfileAction, null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  return (
    <div className='flex w-full flex-col gap-6'>
      <div className='flex flex-col items-center gap-3'>
        <button
          type='button'
          onClick={() => fileInputRef.current?.click()}
          className='group relative h-20 w-20 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
          aria-label='Upload avatar'
        >
          {preview ? (
            <Image src={preview} alt='Avatar preview' fill className='object-cover' />
          ) : (
            <span className='flex h-full w-full items-center justify-center text-muted-foreground'>
              <IconCamera size={24} />
            </span>
          )}
          <span className='absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100'>
            <IconCamera size={20} className='text-white' />
          </span>
        </button>
        <p className='text-xs text-muted-foreground'>Optional photo</p>
      </div>

      <form action={action} className='flex w-full flex-col gap-4'>
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
                  placeholder='Luca'
                  autoComplete='given-name'
                />
              </Field>
              <Field>
                <Label htmlFor='lastName'>Last name</Label>
                <Input
                  id='lastName'
                  name='lastName'
                  type='text'
                  placeholder='Fourfooz'
                  autoComplete='family-name'
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
              />
            </Field>

            {state?.error && <p className='text-sm text-destructive'>{state.error}</p>}

            <Button type='submit' size='lg' disabled={isPending}>
              {isPending ? "Saving…" : "Complete profile"}
            </Button>
          </FieldGroup>
        </FieldSet>
      </form>

      <button
        type='button'
        className='text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
      >
        Skip for now
      </button>
    </div>
  )
}
