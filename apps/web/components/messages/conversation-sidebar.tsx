"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { IconPlus, IconSearch, IconX } from "@tabler/icons-react"
import { useUserCache } from "@/hooks/use-user-cache"
import { useConversationStore, type ConversationMeta } from "@/stores/conversation-store"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { SidebarItem } from "./sidebar-item"
import { NewConversationDialog } from "./new-conversation-dialog"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"

interface SidebarProps {
  currentUserId: string | undefined
  activeId?: string
  className?: string
}

export function ConversationSidebar({ currentUserId, activeId, className = "" }: SidebarProps) {
  const router = useRouter()
  const t = useTranslations("messages")
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [convToDelete, setConvToDelete] = useState<ConversationMeta | null>(null)

  const conversations = useConversationStore((s) => s.conversations)
  const deleteConversation = useConversationStore((s) => s.deleteConversation)
  const cachedUsers = useUserCache((s) => s.users)

  const totalUnreadCount = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0)

  const sortedConversations = useMemo(
    () =>
      [...conversations]
        .filter((c) => c.lastMessage)
        .sort((a, b) => {
          const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
          const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
          return dateB - dateA
        }),
    [conversations]
  )

  // ponytail: client-side filter on already-loaded data; names load lazily per row
  const filteredConversations = useMemo(() => {
    if (!search.trim()) return sortedConversations
    const q = search.toLowerCase()
    return sortedConversations.filter((c) => {
      const otherUserId = c.participantIds.find((id) => id !== currentUserId)
      const cached = otherUserId ? cachedUsers[otherUserId] : undefined
      const name = (c.name || cached?.displayName || "").toLowerCase()
      const last = (c.lastMessage || "").toLowerCase()
      return name.includes(q) || last.includes(q)
    })
  }, [sortedConversations, search, cachedUsers, currentUserId])

  const handleDeleteConversation = (e: React.MouseEvent, conv: ConversationMeta) => {
    e.preventDefault()
    e.stopPropagation()
    setConvToDelete(conv)
  }

  const doDelete = async () => {
    if (!convToDelete) return
    try {
      await deleteConversation(convToDelete._id)
      if (activeId === convToDelete._id) router.push("/messages")
      router.refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setConvToDelete(null)
    }
  }

  return (
    <aside
      className={`h-full w-full flex-col border-r border-border bg-background md:w-80 ${className}`}
    >
      <div className='flex items-center justify-between px-4 pt-4 pb-2'>
        <div className='flex items-center gap-2'>
          <h2 className='text-lg font-bold'>{t("title")}</h2>
          {totalUnreadCount > 0 && (
            <span className='flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground'>
              {totalUnreadCount}
            </span>
          )}
        </div>
        <button
          aria-label={t("newMessage")}
          className='flex size-8 items-center justify-center'
          onClick={() => setOpen(true)}
        >
          <IconPlus size={20} />
        </button>
      </div>

      <div className='px-4 pb-3'>
        <InputGroup className='h-11 rounded-full px-2 text-base'>
          <InputGroupAddon align='inline-start'>
            <InputGroupText>
              <IconSearch size={20} strokeWidth={2} />
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            type='text'
            placeholder={t("search")}
            aria-label={t("search")}
            className='text-base'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <InputGroupAddon align='inline-end'>
              <InputGroupButton
                size='icon-sm'
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setSearch("")}
                aria-label='Clear search'
              >
                <IconX size={16} />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
      </div>

      <div className='flex-1 overflow-y-auto'>
        {filteredConversations.length === 0 ? (
          <p className='p-4 text-center text-sm text-muted-foreground'>
            {search ? t("noResults") : t("noConversations")}
          </p>
        ) : (
          filteredConversations.map((conv) => (
            <SidebarItem
              key={conv._id}
              conv={conv}
              currentUserId={currentUserId}
              activeId={activeId}
              onDelete={handleDeleteConversation}
            />
          ))
        )}
      </div>

      <NewConversationDialog open={open} onOpenChange={setOpen} currentUserId={currentUserId} />

      <ConfirmDialog
        open={!!convToDelete}
        onOpenChange={(o) => {
          if (!o) setConvToDelete(null)
        }}
        title={convToDelete?.isGroup ? t("leaveGroupTitle") : t("deleteChatTitle")}
        description={
          convToDelete?.isGroup ? t("leaveGroupDescription") : t("deleteChatDescription")
        }
        confirmLabel={convToDelete?.isGroup ? t("leave") : t("delete")}
        onConfirm={doDelete}
      />
    </aside>
  )
}
