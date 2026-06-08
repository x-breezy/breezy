"use client"

import { Input } from "@breezy/ui/components/input"

interface ConfirmPasswordFieldProps {
  value: string
  password: string
  onChange: (value: string) => void
}

export function ConfirmPasswordField({ value, password, onChange }: ConfirmPasswordFieldProps) {
  const passwordsMatch = value.length > 0 && value === password

  return (
    <div className='flex flex-col gap-1.5'>
      <label htmlFor='confirm-password' className='px-0.5 text-xs font-semibold text-foreground'>
        Confirm password
      </label>
      <Input
        id='confirm-password'
        type='password'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='••••••••'
        autoComplete='new-password'
        required
      />
      {value.length > 0 && (
        <p
          className={`px-0.5 text-xs font-medium transition-colors ${
            passwordsMatch ? "text-green-500" : "text-destructive"
          }`}
        >
          {passwordsMatch ? "Passwords match" : "Passwords do not match"}
        </p>
      )}
    </div>
  )
}
