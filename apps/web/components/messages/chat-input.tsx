"use client"

import React, { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { IconSend, IconX } from "@tabler/icons-react"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import type { ReplyTo } from "@/lib/actions/messages"

interface ChatInputProps {
  onSend: (content: string, replyTo?: ReplyTo) => void
  replyTo?: ReplyTo | null
  onCancelReply?: () => void
  disabled?: boolean
}

export function ChatInput({ onSend, replyTo, onCancelReply, disabled }: ChatInputProps) {
  const t = useTranslations("messages")
  const [text, setText] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when a reply is set
  useEffect(() => {
    if (replyTo) inputRef.current?.focus()
  }, [replyTo])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim() && !disabled) {
      onSend(text.trim(), replyTo ?? undefined)
      setText("")
      onCancelReply?.()
    }
  }

  return (
    <div className='border-t border-border bg-background/80 backdrop-blur-md'>
      {replyTo && (
        <div className='flex items-center justify-between px-4 pt-2 pb-0'>
          <div className='flex min-w-0 flex-col text-xs text-muted-foreground'>
            <span className='font-semibold text-foreground'>
              {t("replyingTo", { name: replyTo.senderName })}
            </span>
            <span className='truncate'>{replyTo.content}</span>
          </div>
          <button
            type='button'
            onClick={onCancelReply}
            className='ml-2 shrink-0 rounded-full p-1 hover:bg-muted'
            aria-label={t("cancelReply")}
          >
            <IconX size={14} />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className='flex items-center px-4 py-3'>
        <InputGroup className='h-11 w-full rounded-full px-2 text-base'>
          <InputGroupInput
            ref={inputRef}
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
    </div>
  )
}
