"use client"

import { Field } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useTranslations } from "next-intl"
import { IconCheck, IconCircleDashed, IconEye, IconEyeClosed, IconLock } from "@tabler/icons-react"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group"

export function getCriteria(t: any) {
  return [
    { label: t("ruleLength"), test: (p: string) => p.length >= 8 },
    { label: t("ruleUppercase"), test: (p: string) => /[A-Z]/.test(p) },
    { label: t("ruleNumber"), test: (p: string) => /[0-9]/.test(p) },
  ]
}

export function getStrength(password: string): 0 | 1 | 2 | 3 {
  const score = [
    (p: string) => p.length >= 8,
    (p: string) => /[A-Z]/.test(p),
    (p: string) => /[0-9]/.test(p),
  ].filter((testFn) => testFn(password)).length
  return score as 0 | 1 | 2 | 3
}

export function getStrengthLabel(t: any) {
  return ["", t("strengthWeak"), t("strengthFair"), t("strengthStrong")]
}

const strengthColor = ["", "bg-destructive", "bg-yellow-400", "bg-green-500"]
const strengthTextColor = ["", "text-destructive", "text-yellow-500", "text-green-500"]

interface PasswordFieldProps {
  id: string
  name?: string
  value: string
  onChange: (value: string) => void
  showStrength?: boolean
}

export function PasswordField({
  id,
  name,
  value,
  onChange,
  showStrength = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const strength = getStrength(value)
  const t = useTranslations("auth")
  const criteriaList = getCriteria(t)
  const labels = getStrengthLabel(t)

  return (
    <Field>
      <Label htmlFor={id}>{t("password")}</Label>
      <InputGroup>
        <InputGroupInput
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t("passwordPlaceholder")}
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
          <p className={`text-xs font-medium ${strengthTextColor[strength]}`}>{labels[strength]}</p>
          <ul className='flex flex-col gap-0.5'>
            {criteriaList.map((c) => (
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
