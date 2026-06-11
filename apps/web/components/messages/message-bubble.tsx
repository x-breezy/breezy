import React from "react"
import { format } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface MessageBubbleProps {
  content: string
  createdAt: string
  isOwn: boolean
  isConsecutive?: boolean
  avatarUrl?: string
}

export function MessageBubble({ content, createdAt, isOwn, isConsecutive, avatarUrl }: MessageBubbleProps) {
  return (
    <div
      className={`flex w-full ${isConsecutive ? "mb-1" : "mb-4"} ${isOwn ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 fade-in duration-300 gap-2`}
    >
      {!isOwn && (
        <Avatar className={`w-8 h-8 shrink-0 self-end ${isConsecutive ? "invisible" : ""}`}>
          {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />}
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            U
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
          isOwn
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted border border-border text-foreground rounded-tl-sm"
        }`}
      >
        <p className="text-sm leading-relaxed">{content}</p>
        <span
          className={`text-[10px] mt-1 block ${
            isOwn ? "text-primary-foreground/80 text-right" : "text-muted-foreground text-left"
          }`}
        >
          {format(new Date(createdAt), "HH:mm")}
        </span>
      </div>
    </div>
  )
}
