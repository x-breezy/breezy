"use client"

import React, { useState } from "react"
import { IconSend } from "@tabler/icons-react"
import { Button } from "@/components/button"
import { Input } from "@/components/input"

interface ChatInputProps {
  onSend: (content: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
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
      className='flex items-center gap-2 border-t border-border bg-background/80 p-4 backdrop-blur-md'
    >
      <Input
        type='text'
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Type a message...'
        disabled={disabled}
        className='flex-1 rounded-full px-4 py-5'
      />
      <Button
        type='submit'
        size='icon'
        disabled={!text.trim() || disabled}
        className='shrink-0 rounded-full'
      >
        <IconSend size={18} />
      </Button>
    </form>
  )
}
