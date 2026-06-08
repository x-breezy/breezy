"use client"

import { Field } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { IconCheck, IconCircleDashed, IconEye, IconEyeClosed, IconLock } from "@tabler/icons-react"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group"

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
  name?: string
  value: string
  onChange: (value: string) => void
  showStrength?: boolean
}

export function PasswordField({ id, name, value, onChange, showStrength = false }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const strength = getStrength(value)

  return (
    <Field>
      <Label htmlFor={id}>Password</Label>
      <InputGroup>
        <InputGroupInput
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='Enter your password'
          autoComplete='new-password'
          required
        />
        <InputGroupAddon align='inline-start'>
          <IconLock />
        </InputGroupAddon>
        <InputGroupAddon
          align='inline-end'
          onClick={() => setVisible((v) => !v)}
          className='cursor-pointer'
        >
          {visible ? <IconEye /> : <IconEyeClosed />}
        </InputGroupAddon>
      </InputGroup>
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
                <span>
                  {c.test(value) ? (
                    <IconCheck stroke={3} size={12} />
                  ) : (
                    <IconCircleDashed stroke={3} size={12} />
                  )}
                </span>
                {c.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Field>
  )
}
