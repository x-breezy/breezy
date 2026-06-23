"use client"

import React, { useState } from "react"
import { useTranslations } from "next-intl"
import { IconSend } from "@tabler/icons-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const t = useTranslations("messages")
  const [text, setText] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim() && !disabled) {
      onSend(text.trim())
      setText("")
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='flex items-center border-t border-border bg-background/80 px-4 py-3 backdrop-blur-md'
    >
      <InputGroup className='h-11 w-full rounded-full px-2 text-base'>
        <InputGroupInput
          type='text'
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("messagePlaceholder")}
          disabled={disabled}
          className='text-base'
        />
        <InputGroupAddon align='inline-end'>
          <InputGroupButton
            type='submit'
            variant={!text.trim() ? "ghost" : "default"}
            size='sm'
            disabled={!text.trim() || disabled}
          >
            <IconSend size={18} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  )
}
