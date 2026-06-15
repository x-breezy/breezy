"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Field } from "@/components/ui/field"
import { Label } from "@/components/ui/label"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group"
import { IconLock, IconEye, IconEyeClosed } from "@tabler/icons-react"

interface ConfirmPasswordFieldProps {
  value: string
  password: string
  onChange: (value: string) => void
}

export function ConfirmPasswordField({ value, password, onChange }: ConfirmPasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  const passwordsMatch = value.length > 0 && value === password
  const t = useTranslations("auth")

  return (
    <Field>
      <Label htmlFor='confirm-password'>{t("confirmPassword")}</Label>
      <InputGroup>
        <InputGroupInput
          id='confirm-password'
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder='Confirm your password'
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
      {value.length > 0 && (
        <p
          className={`px-0.5 text-sm font-medium transition-colors ${
            passwordsMatch ? "text-green-500" : "text-destructive"
          }`}
        >
          {passwordsMatch ? t("passwordsMatch") : t("passwordsMismatch")}
        </p>
      )}
    </Field>
  )
}
