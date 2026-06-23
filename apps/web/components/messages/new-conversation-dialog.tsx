"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { IconSearch, IconUsersGroup, IconX, IconLoader2 } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProfileAvatar } from "@/components/profile"
import { searchProfiles, type SearchProfile } from "@/lib/actions/profiles"
import { listFollowing } from "@/lib/actions/follow-list"
import { getUserByUsername } from "@/lib/actions/conversations"
import { useConversationStore } from "@/stores/conversation-store"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 100

interface NewConversationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId: string | undefined
  conversationId?: string
  participantIds?: string[]
}

function ProfileRow({
  profile,
  selected,
  onClick,
}: {
  profile: SearchProfile
  selected?: boolean
  onClick: () => void
}) {
  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    profile.username ||
    "Utilisateur"

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50",
        selected && "bg-accent/50"
      )}
    >
      <ProfileAvatar src={profile.avatarUrl ?? undefined} size='xs' className='size-12 shrink-0' />
      <div className='min-w-0'>
        <p className='truncate font-semibold'>{displayName}</p>
        {profile.username && (
          <p className='truncate text-sm text-muted-foreground'>@{profile.username}</p>
        )}
      </div>
    </button>
  )
}

export function NewConversationDialog({
  open,
  onOpenChange,
  currentUserId,
  conversationId,
  participantIds,
}: NewConversationDialogProps) {
  const t = useTranslations("messages")
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<SearchProfile[]>([])
  const [suggestionsPage, setSuggestionsPage] = useState(1)
  const [suggestionsTotal, setSuggestionsTotal] = useState(0)
  const [searchResults, setSearchResults] = useState<SearchProfile[]>([])
  const [searchPage, setSearchPage] = useState(1)
  const [searchTotal, setSearchTotal] = useState(0)
  const [searchLoading, setSearchLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selected, setSelected] = useState<SearchProfile[]>([])
  const [isGroupMode, setIsGroupMode] = useState(!!conversationId)
  const [creating, setCreating] = useState(false)
  const createConversation = useConversationStore((s) => s.createConversation)
  const addMember = useConversationStore((s) => s.addMember)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const isAddMode = !!conversationId

  useEffect(() => {
    if (!open) {
      setQuery("")
      setSearchResults([])
      setSuggestions([])
      setSuggestionsPage(1)
      setSuggestionsTotal(0)
      setSearchPage(1)
      setSearchTotal(0)
      setSelected([])
      if (!conversationId) setIsGroupMode(false)
    }
  }, [open, conversationId])

  // Load following list as initial suggestions
  useEffect(() => {
    if (!open || !currentUserId) return
    listFollowing(currentUserId, 1, PAGE_SIZE)
      .then((res) => {
        setSuggestions(res.profiles.filter((p) => p.username))
        setSuggestionsTotal(res.total)
        setSuggestionsPage(1)
      })
      .catch(() => {})
  }, [open, currentUserId])

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!query.trim()) {
      setSearchResults([])
      setSearchPage(1)
      setSearchTotal(0)
      return
    }
    timerRef.current = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const res = await searchProfiles(query, 1, PAGE_SIZE)
        setSearchResults(res.profiles.filter((p) => p.username && p.profileId !== currentUserId))
        setSearchTotal(res.total)
        setSearchPage(1)
      } catch {
        setSearchResults([])
      } finally {
        setSearchLoading(false)
      }
    }, 300)
  }, [query, currentUserId])

  const isSearching = !!query.trim()

  const loadMore = useCallback(async () => {
    if (loadingMore) return
    if (isSearching) {
      if (searchResults.length >= searchTotal) return
      const nextPage = searchPage + 1
      setLoadingMore(true)
      try {
        const res = await searchProfiles(query, nextPage, PAGE_SIZE)
        setSearchResults((prev) => [
          ...prev,
          ...res.profiles.filter((p) => p.username && p.profileId !== currentUserId),
        ])
        setSearchPage(nextPage)
        setSearchTotal(res.total)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingMore(false)
      }
    } else {
      if (suggestions.length >= suggestionsTotal) return
      const nextPage = suggestionsPage + 1
      setLoadingMore(true)
      try {
        const res = await listFollowing(currentUserId!, nextPage, PAGE_SIZE)
        setSuggestions((prev) => [...prev, ...res.profiles.filter((p) => p.username)])
        setSuggestionsPage(nextPage)
        setSuggestionsTotal(res.total)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingMore(false)
      }
    }
  }, [
    loadingMore,
    isSearching,
    searchResults.length,
    searchTotal,
    searchPage,
    suggestions.length,
    suggestionsTotal,
    suggestionsPage,
    query,
    currentUserId,
  ])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore()
      },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [loadMore])

  const displayed = (isSearching ? searchResults : suggestions).filter(
    (p) => !participantIds?.includes(p.profileId)
  )

  const hasMore = isSearching
    ? searchResults.length < searchTotal
    : suggestions.length < suggestionsTotal

  const toggleSelect = (profile: SearchProfile) => {
    setSelected((prev) =>
      prev.find((p) => p.profileId === profile.profileId)
        ? prev.filter((p) => p.profileId !== profile.profileId)
        : [...prev, profile]
    )
  }

  const handleSelect = async (profile: SearchProfile) => {
    if (isGroupMode || isAddMode) {
      toggleSelect(profile)
      return
    }
    if (!profile.username || creating) return
    setCreating(true)
    try {
      const { id } = await getUserByUsername(profile.username)
      const conv = await createConversation([id])
      onOpenChange(false)
      router.push(`/messages/${conv._id}`)
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  const handleCreateGroup = async () => {
    if (selected.length < 1 || creating) return
    setCreating(true)
    try {
      const memberIds: string[] = []
      for (const p of selected) {
        if (!p.username) continue
        const { id } = await getUserByUsername(p.username)
        memberIds.push(id)
      }
      if (isAddMode && conversationId) {
        await addMember(conversationId, memberIds)
      } else {
        const name = selected.map((p) => p.firstName || p.username || "?").join(", ")
        const conv = await createConversation(memberIds, name)
        router.push(`/messages/${conv._id}`)
      }
      onOpenChange(false)
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        centered
        className='flex max-h-150 min-h-150 flex-col gap-0 overflow-hidden p-0 sm:max-w-md'
      >
        <DialogHeader className='border-b border-border px-5 py-4 pr-12'>
          <DialogTitle className='text-lg font-bold'>
            {isAddMode ? "Add people" : "New message"}
          </DialogTitle>
        </DialogHeader>

        <div className='border-b border-border px-4 py-3'>
          <div className='relative'>
            <IconSearch
              size={15}
              className='absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground'
            />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search name or username'
              className='rounded-full border-transparent bg-muted pl-8 focus:border-border'
            />
          </div>
        </div>

        <div className='flex-1 overflow-y-auto'>
          {!isGroupMode && !isAddMode && (
            <button
              onClick={() => setIsGroupMode(true)}
              className='flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50'
            >
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary/10'>
                <IconUsersGroup size={20} className='text-primary' />
              </div>
              <span className='font-semibold text-primary'>Create a group</span>
            </button>
          )}

          {isGroupMode && selected.length > 0 && (
            <div className='flex flex-wrap gap-2 border-b border-border px-4 py-3'>
              {selected.map((p) => (
                <button
                  key={p.profileId}
                  onClick={() => toggleSelect(p)}
                  className='flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary'
                >
                  <ProfileAvatar src={p.avatarUrl ?? undefined} size='2xs' className='size-5' />
                  {p.firstName || p.username}
                  <IconX size={12} />
                </button>
              ))}
            </div>
          )}

          {displayed.map((profile) => (
            <ProfileRow
              key={profile.profileId}
              profile={profile}
              selected={selected.some((s) => s.profileId === profile.profileId)}
              onClick={() => handleSelect(profile)}
            />
          ))}

          {loadingMore && (
            <div className='flex justify-center py-3'>
              <IconLoader2 className='animate-spin' size={20} />
            </div>
          )}

          {hasMore && <div ref={sentinelRef} className='h-px' />}

          {searchLoading && <p className='px-4 py-3 text-sm text-muted-foreground'>Searching…</p>}

          {!searchLoading && isSearching && searchResults.length === 0 && (
            <p className='px-4 py-3 text-sm text-muted-foreground'>
              No results for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        {isGroupMode && selected.length >= 1 && (
          <div className='border-t border-border px-4 py-3'>
            <Button onClick={handleCreateGroup} disabled={creating} className='w-full rounded-full'>
              {creating
                ? "Adding…"
                : isAddMode
                  ? `Add to group (${selected.length})`
                  : `Create group (${selected.length})`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
