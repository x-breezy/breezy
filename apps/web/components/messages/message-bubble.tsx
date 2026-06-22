import React from "react"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type MessageBubbleProps =
  | {
      variant: "message"
      content: string
      createdAt: string
      isOwn: boolean
      isConsecutive?: boolean
      avatarUrl?: string
      senderName?: string
    }
  | { variant: "system"; content: string; senderName?: string }
  | { variant: "writing"; avatarUrl?: string }

export function MessageBubble(props: MessageBubbleProps) {
  if (props.variant === "system") {
    return (
      <div className='my-3 flex w-full justify-center'>
        <div className='flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-500 dark:bg-gray-800/50'>
          <span className='font-medium text-gray-700 dark:text-gray-300'>
            {props.senderName || "Quelqu'un"}
          </span>
          <span>{props.content}</span>
        </div>
      </div>
    )
  }

  if (props.variant === "writing") {
    return (
      <div className='mb-4 flex w-full justify-start gap-2'>
        <Avatar className='h-8 w-8 shrink-0 self-end'>
          {props.avatarUrl && (
            <AvatarImage src={props.avatarUrl} alt='Avatar' className='object-cover' />
          )}
          <AvatarFallback className='bg-primary/10 text-xs font-semibold text-primary'>
            U
          </AvatarFallback>
        </Avatar>
        <div className='flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-muted px-4 py-3 shadow-sm'>
          <span className='h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]' />
          <span className='h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]' />
          <span className='h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]' />
        </div>
      </div>
    )
  }

  const { content, createdAt, isOwn, isConsecutive, avatarUrl, senderName } = props

  return (
    <div
      className={`flex w-full ${isConsecutive ? "mb-1" : "mb-4"} ${isOwn ? "justify-end" : "justify-start"}`}
    >
      {!isOwn && (
        <Avatar className={`h-8 w-8 shrink-0 self-end ${isConsecutive ? "invisible" : ""}`}>
          {avatarUrl && <AvatarImage src={avatarUrl} alt='Avatar' className='object-cover' />}
          <AvatarFallback className='bg-primary/10 text-xs font-semibold text-primary'>
            U
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isOwn
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm border border-border bg-muted text-foreground"
        }`}
      >
        <p className='text-sm leading-relaxed'>{content}</p>
        <span
          className={`mt-1 block text-[10px] ${
            isOwn ? "text-right text-primary-foreground/80" : "text-left text-muted-foreground"
          }`}
        >
          {format(new Date(createdAt), "HH:mm")}
        </span>
      </div>
    </div>
  )
}
