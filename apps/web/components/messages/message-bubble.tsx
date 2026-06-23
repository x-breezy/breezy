"use client"

import React, { useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { IconArrowBackUp } from "@tabler/icons-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { timeAgo } from "@/lib/utils"
import type { ReplyTo } from "@/lib/actions/messages"

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
      replyTo?: ReplyTo
      onReply?: () => void
    }
  | { variant: "system"; content: string; senderName?: string }
  | { variant: "writing"; avatarUrl?: string }

export function MessageBubble(props: MessageBubbleProps) {
  const t = useTranslations("messages")
  const [hovered, setHovered] = useState(false)
  const [swipeDx, setSwipeDx] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const swipeTriggered = useRef(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches[0]) return
    touchStartX.current = e.touches[0].clientX
    swipeTriggered.current = false
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || !e.touches[0]) return
    const dx = e.touches[0].clientX - touchStartX.current
    // Only allow swipe in the reply direction (right for received, left for own)
    const directional = isOwn ? Math.min(0, dx) : Math.max(0, dx)
    const clamped = isOwn ? Math.max(-60, directional) : Math.min(60, directional)
    setSwipeDx(clamped)
    if (!swipeTriggered.current && Math.abs(clamped) >= 50) {
      swipeTriggered.current = true
      onReply?.()
    }
  }

  const handleTouchEnd = () => {
    touchStartX.current = null
    setSwipeDx(0)
  }

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

  const {
    content,
    createdAt,
    isOwn,
    isConsecutive,
    isLastOfGroup,
    avatarUrl,
    senderName,
    replyTo,
    onReply,
  } = props

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

  const replyButton = onReply && (
    <button
      onClick={onReply}
      className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
      title={t("reply")}
      aria-label={t("reply")}
    >
      <IconArrowBackUp size={16} />
    </button>
  )

  const swipeProgress = Math.min(Math.abs(swipeDx) / 50, 1)

  return (
    <div
      className={`group flex w-full ${isConsecutive ? "mb-0.5" : "mt-3 mb-0.5"} ${isOwn ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

      <div className={`max-w-[70%] min-w-0`}>
        <div className={`flex min-w-0 flex-col ${isOwn ? "items-end" : "items-start"}`}>
          {!isOwn && !isConsecutive && senderName && (
            <span className='mb-1 ml-1 text-xs text-muted-foreground'>{senderName}</span>
          )}

          {/* Reply preview */}
          {replyTo && (
            <div
              className={`mt-4 mb-1 flex w-fit flex-col gap-0.5 ${isOwn ? "items-end" : "items-start"}`}
            >
              <span className='px-1 text-xs font-semibold text-white/70'>{replyTo.senderName}</span>
              <div
                className={`w-fit truncate rounded-xl px-3 py-1.5 text-xs opacity-70 ${
                  isOwn
                    ? "bg-primary/60 text-primary-foreground"
                    : "bg-secondary/80 text-muted-foreground"
                }`}
              >
                <span className='block w-fit truncate'>{replyTo.content}</span>
              </div>
            </div>
          )}

          {/* Bubble — reply button absolutely centered, swipe on mobile */}
          <div
            className={`relative w-full px-3.5 py-2 transition-transform ${
              swipeDx !== 0 ? "" : "duration-200"
            } ${
              isOwn
                ? `bg-primary text-primary-foreground ${ownCorners}`
                : `bg-secondary text-foreground ${receivedCorners}`
            }`}
            style={{ transform: swipeDx !== 0 ? `translateX(${swipeDx}px)` : undefined }}
            onTouchStart={onReply ? handleTouchStart : undefined}
            onTouchMove={onReply ? handleTouchMove : undefined}
            onTouchEnd={onReply ? handleTouchEnd : undefined}
          >
            <p className='text-sm leading-relaxed [overflow-wrap:anywhere]'>{content}</p>
            {onReply && (
              <div
                className={`absolute top-1/2 flex -translate-y-1/2 items-center transition-opacity ${
                  isOwn ? "-left-8" : "-right-8"
                } ${hovered ? "opacity-100" : "opacity-0"}`}
                style={{ opacity: swipeProgress > 0 ? swipeProgress : undefined }}
              >
                {replyButton}
              </div>
            )}
          </div>
          {isLastOfGroup && (
            <span className='mt-0.5 px-1 text-[10px] text-muted-foreground'>
              {timeAgo(createdAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
