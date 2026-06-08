"use client"

import { Input } from "@breezy/ui/components/input"

const criteria = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
]

export function getStrength(password: string): 0 | 1 | 2 | 3 {
  const score = criteria.filter((c) => c.test(password)).length
  return score as 0 | 1 | 2 | 3
}

const strengthLabel = ["", "Weak", "Fair", "Strong"]
const strengthColor = ["", "bg-destructive", "bg-yellow-400", "bg-green-500"]
const strengthTextColor = ["", "text-destructive", "text-yellow-500", "text-green-500"]

interface PasswordFieldProps {
  id: string
  value: string
  onChange: (value: string) => void
  showStrength?: boolean
}

export function PasswordField({ id, value, onChange, showStrength = false }: PasswordFieldProps) {
  const strength = getStrength(value)

  return (
    <div className='flex flex-col gap-1.5'>
      <label htmlFor={id} className='px-0.5 text-xs font-semibold text-foreground'>
        Password
      </label>
      <Input
        id={id}
        type='password'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder='••••••••'
        autoComplete='new-password'
        required
      />
      {showStrength && value.length > 0 && (
        <div className='flex flex-col gap-1.5 px-0.5'>
          <div className='flex gap-1'>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                  strength >= i ? strengthColor[strength] : "bg-muted"
                }`}
              />
            ))}
          </div>
          <p className={`text-xs font-medium ${strengthTextColor[strength]}`}>
            {strengthLabel[strength]}
          </p>
          <ul className='flex flex-col gap-0.5'>
            {criteria.map((c) => (
              <li
                key={c.label}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  c.test(value) ? "text-green-500" : "text-muted-foreground"
                }`}
              >
                <span>{c.test(value) ? "✓" : "○"}</span>
                {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
