"use client"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldSet } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface AboutStepProps {
  firstName: string
  lastName: string
  bio: string
  onChange: (field: "firstName" | "lastName" | "bio", value: string) => void
  onNext: () => void
  onSkip: () => void
}

export function AboutStep({ firstName, lastName, bio, onChange, onNext, onSkip }: AboutStepProps) {
  return (
    <div className='flex w-full flex-col gap-6'>
      <FieldSet>
        <FieldGroup>
          <div className='grid grid-cols-2 gap-3'>
            <Field>
              <Label htmlFor='firstName'>First name</Label>
              <Input
                id='firstName'
                type='text'
                placeholder='Sam'
                autoComplete='given-name'
                value={firstName}
                onChange={(e) => onChange("firstName", e.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor='lastName'>Last name</Label>
              <Input
                id='lastName'
                type='text'
                placeholder='Altman'
                autoComplete='family-name'
                value={lastName}
                onChange={(e) => onChange("lastName", e.target.value)}
              />
            </Field>
          </div>

          <Field>
            <Label htmlFor='bio'>Bio</Label>
            <Textarea
              id='bio'
              placeholder='Tell people a little about yourself…'
              rows={3}
              className='resize-none'
              value={bio}
              onChange={(e) => onChange("bio", e.target.value)}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <div className='flex flex-col gap-3'>
        <Button size='lg' onClick={onNext}>
          Continue
        </Button>
        <button
          type='button'
          onClick={onSkip}
          className='text-sm font-medium text-muted-foreground transition-colors hover:text-foreground'
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}
