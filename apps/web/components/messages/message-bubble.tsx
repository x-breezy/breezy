"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { timeAgo } from "@/lib/utils"

type MessageBubbleProps =
  | {
      variant: "message"
      content: string
      createdAt: string
      isOwn: boolean
      isConsecutive?: boolean
      isLastOfGroup?: boolean
      avatarUrl?: string
      senderName?: string
    }
  | { variant: "system"; content: string; senderName?: string }
  | { variant: "writing"; avatarUrl?: string }

export function MessageBubble(props: MessageBubbleProps) {
  const t = useTranslations("messages")

  if (props.variant === "system") {
    return (
      <div className='my-3 flex w-full justify-center'>
        <div className='flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground'>
          <span className='font-medium text-foreground'>{props.senderName || t("someone")}</span>
          <span>{props.content}</span>
        </div>
      </div>
    )
  }

  if (props.variant === "writing") {
    return (
      <div className='mb-1 flex w-full justify-start gap-2'>
        <Avatar className='h-7 w-7 shrink-0 self-end'>
          {props.avatarUrl && (
            <AvatarImage src={props.avatarUrl} alt='Avatar' className='object-cover' />
          )}
          <AvatarFallback className='bg-primary/10 text-xs font-semibold text-primary'>
            U
          </AvatarFallback>
        </Avatar>
        <div className='flex items-center gap-1 rounded-3xl rounded-bl-md bg-secondary px-4 py-2.5'>
          <span className='h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]' />
          <span className='h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]' />
          <span className='h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]' />
        </div>
      </div>
    )
  }

  const { content, createdAt, isOwn, isConsecutive, isLastOfGroup, avatarUrl, senderName } = props

  // Instagram-style grouped corners: inner corners flatten when bubbles are stacked
  const ownCorners = [
    "rounded-3xl",
    isConsecutive ? "rounded-tr-lg" : "",
    isLastOfGroup === false ? "rounded-br-lg" : "",
  ]
    .filter(Boolean)
    .join(" ")

  const receivedCorners = [
    "rounded-3xl",
    isConsecutive ? "rounded-tl-lg" : "",
    isLastOfGroup === false ? "rounded-bl-lg" : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div
      className={`flex w-full ${isConsecutive ? "mb-0.5" : "mt-3 mb-0.5"} ${isOwn ? "justify-end" : "justify-start"}`}
    >
      {!isOwn && (
        <Avatar
          className={`mr-1.5 h-7 w-7 shrink-0 self-end ${isLastOfGroup === false ? "invisible" : ""}`}
        >
          {avatarUrl && <AvatarImage src={avatarUrl} alt='Avatar' className='object-cover' />}
          <AvatarFallback className='bg-primary/10 text-xs font-semibold text-primary'>
            U
          </AvatarFallback>
        </Avatar>
      )}

      <div className={`flex max-w-[70%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && !isConsecutive && senderName && (
          <span className='mb-1 ml-1 text-xs text-muted-foreground'>{senderName}</span>
        )}
        <div
          className={`px-3.5 py-2 ${
            isOwn
              ? `bg-primary text-primary-foreground ${ownCorners}`
              : `bg-secondary text-foreground ${receivedCorners}`
          }`}
        >
          <p className='text-sm leading-relaxed'>{content}</p>
        </div>
        {isLastOfGroup && (
          <span className='mt-0.5 px-1 text-[10px] text-muted-foreground'>
            {timeAgo(createdAt)}
          </span>
        )}
      </div>
    </div>
  )
}
