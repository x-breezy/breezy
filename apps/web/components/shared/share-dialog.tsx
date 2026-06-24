"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  IconSearch,
  IconX,
  IconLoader2,
  IconSend,
  IconShare3,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ProfileAvatar } from "@/components/profile"
import { ConversationGroupAvatar } from "@/components/shared/conversation-group-avatar"
import { useUserStore } from "@/stores/user-store"
import { type ConversationMeta } from "@/stores/conversation-store"
import { listFollowers, listFollowing } from "@/lib/actions/follow-list"
import { listConversations } from "@/lib/actions/conversations"
import { shareToProfile, shareToConversation } from "@/lib/actions/share"
import { type SearchProfile } from "@/lib/actions/profiles"
import { mediaUrl } from "@/lib/utils"
import { UsernameDisplay } from "@/components/shared/username-display"
import { UserRole } from "@/lib/auth/role"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shareUrl: string
  shareTitle?: string
}

type RecipientTab = "following" | "followers" | "groups"

const PAGE_SIZE = 100

function ProfileRow({
  profile,
  onClick,
  sending,
}: {
  profile: SearchProfile
  onClick: () => void
  sending: boolean
}) {
  const displayName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.username || ""

  return (
    <button
      onClick={onClick}
      disabled={sending}
      className='flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 disabled:opacity-50'
    >
      <ProfileAvatar
        src={profile.avatarUrl || undefined}
        alt={displayName}
        size='2xs'
        className='size-11 shrink-0'
      />
      <div className='min-w-0 flex-1'>
        <UsernameDisplay
          name={displayName}
          role={profile.role as UserRole | undefined}
          nameClassName='truncate font-semibold'
          badgeClassName='size-4'
        />
        {profile.username && (
          <p className='truncate text-sm text-muted-foreground'>@{profile.username}</p>
        )}
      </div>
      {sending ? (
        <IconLoader2 size={18} className='animate-spin text-muted-foreground' />
      ) : (
        <IconSend size={18} className='text-muted-foreground' />
      )}
    </button>
  )
}

function GroupRow({
  conv,
  currentUserId,
  onClick,
  sending,
}: {
  conv: ConversationMeta
  currentUserId: string | undefined
  onClick: () => void
  sending: boolean
}) {
  const visibleIds = conv.participantIds.filter((id) => id !== currentUserId)
  const otherUserId = visibleIds[0]
  const otherProfile = conv.participants?.[otherUserId ?? ""]
  const displayName =
    conv.name ||
    (otherProfile
      ? [otherProfile.firstName, otherProfile.lastName].filter(Boolean).join(" ") ||
        otherProfile.username
      : undefined) ||
    "Groupe"

  const avatarUrl = otherProfile?.avatarId
    ? otherProfile.avatarId.startsWith("http")
      ? otherProfile.avatarId
      : mediaUrl(otherProfile.avatarId)
    : undefined

  return (
    <button
      onClick={onClick}
      disabled={sending}
      className='flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 disabled:opacity-50'
    >
      {conv.isGroup ? (
        <ConversationGroupAvatar
          participantIds={visibleIds}
          totalCount={visibleIds.length}
          className='size-11'
        />
      ) : (
        <ProfileAvatar src={avatarUrl} alt={displayName} size='2xs' className='size-11 shrink-0' />
      )}
      <div className='min-w-0 flex-1'>
        <p className='truncate font-semibold'>{displayName}</p>
        {conv.lastMessage && (
          <p className='truncate text-sm text-muted-foreground'>{conv.lastMessage}</p>
        )}
      </div>
      {sending ? (
        <IconLoader2 size={18} className='animate-spin text-muted-foreground' />
      ) : (
        <IconSend size={18} className='text-muted-foreground' />
      )}
    </button>
  )
}

export function ShareDialog({ open, onOpenChange, shareUrl, shareTitle }: ShareDialogProps) {
  const t = useTranslations("shareDialog")
  const router = useRouter()
  const currentUserId = useUserStore((s) => s.profile?.profileId)

  const [dialogKey, setDialogKey] = useState(0)
  const [mainTab, setMainTab] = useState<"breezy" | "external">("breezy")
  const [recipientTab, setRecipientTab] = useState<RecipientTab>("following")
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [followers, setFollowers] = useState<SearchProfile[]>([])
  const [following, setFollowing] = useState<SearchProfile[]>([])
  const [conversations, setConversations] = useState<ConversationMeta[]>([])
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && open) {
      setDialogKey((k) => k + 1)
    }
    onOpenChange(nextOpen)
  }

  useEffect(() => {
    if (!open || !currentUserId) return

    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        if (recipientTab === "followers") {
          const res = await listFollowers(currentUserId!, 1, PAGE_SIZE)
          setFollowers(res.profiles)
        } else if (recipientTab === "following") {
          const res = await listFollowing(currentUserId!, 1, PAGE_SIZE)
          setFollowing(res.profiles)
        } else if (recipientTab === "groups") {
          const convs = await listConversations()
          setConversations(convs)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("loadError"))
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [open, currentUserId, recipientTab, t])

  const handleExternalShare = async () => {
    if (canShareExternally) {
      try {
        await navigator.share({ url: shareUrl, title: shareTitle })
        handleOpenChange(false)
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message)
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        setError(err instanceof Error ? err.message : t("copyError"))
      }
    }
  }

  const handleShareToProfile = async (profile: SearchProfile) => {
    if (!profile.profileId || sendingId) return
    setSendingId(profile.profileId)
    try {
      const conversationId = await shareToProfile(profile.profileId, shareUrl)
      router.push(`/messages/${conversationId}`)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sendError"))
    } finally {
      setSendingId(null)
    }
  }

  const handleShareToGroup = async (conv: ConversationMeta) => {
    if (sendingId) return
    setSendingId(conv._id)
    try {
      await shareToConversation(conv._id, shareUrl)
      router.push(`/messages/${conv._id}`)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("sendError"))
    } finally {
      setSendingId(null)
    }
  }

  const emptyMessage = (() => {
    if (recipientTab === "followers") return t("noFollowers")
    if (recipientTab === "following") return t("noFollowing")
    return t("noGroups")
  })()

  const canShareExternally =
    typeof navigator !== "undefined" && typeof navigator.share === "function"

  const filteredProfiles = useMemo(() => {
    const list = recipientTab === "followers" ? followers : following
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((p) => {
      const name = [p.firstName, p.lastName].filter(Boolean).join(" ").toLowerCase()
      const handle = (p.username || "").toLowerCase()
      return name.includes(q) || handle.includes(q)
    })
  }, [query, recipientTab, followers, following])

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((c) => {
      const visibleIds = c.participantIds.filter((id) => id !== currentUserId)
      const otherId = visibleIds[0]
      const other = c.participants?.[otherId ?? ""]
      const name = (
        c.name ||
        [other?.firstName, other?.lastName].filter(Boolean).join(" ") ||
        other?.username ||
        ""
      ).toLowerCase()
      return name.includes(q)
    })
  }, [query, conversations, currentUserId])

  const isProfileTab = recipientTab === "followers" || recipientTab === "following"
  const displayedItems = isProfileTab ? filteredProfiles : filteredGroups

  return (
    <Dialog key={dialogKey} open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        centered
        className='flex max-h-[85vh] min-h-[450px] flex-col gap-0 overflow-hidden p-0 sm:max-w-md'
        showCloseButton={false}
      >
        <DialogHeader className='border-b border-border px-5 py-4 pr-12'>
          <DialogTitle className='text-lg font-bold'>{t("title")}</DialogTitle>
          <DialogDescription className='sr-only'>{shareTitle || shareUrl}</DialogDescription>
        </DialogHeader>

        <Tabs
          value={mainTab}
          onValueChange={(value) => setMainTab(value as "breezy" | "external")}
          className='flex flex-1 flex-col'
        >
          <TabsList className='mx-4 mt-3 mb-0 w-full sm:w-fit'>
            <TabsTrigger value='breezy' className='min-w-fit'>
              {t("breezyTab")}
            </TabsTrigger>
            <TabsTrigger value='external' className='min-w-fit'>
              {t("externalTab")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='breezy' className='flex flex-1 flex-col overflow-hidden px-0 py-0'>
            <div className='border-b border-border px-4 py-3'>
              <div className='relative'>
                <IconSearch
                  size={15}
                  className='absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground'
                />
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search")}
                  className='rounded-full border-transparent bg-muted pl-8 focus:border-border'
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery("")
                      inputRef.current?.focus()
                    }}
                    className='absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground'
                  >
                    <IconX size={14} />
                  </button>
                )}
              </div>
            </div>

            <Tabs
              value={recipientTab}
              onValueChange={(value) => setRecipientTab(value as RecipientTab)}
            >
              <TabsList variant='line' className='mt-2 mb-0 grid w-full grid-cols-3 justify-start'>
                <TabsTrigger value='following' className='min-w-fit'>
                  {t("following")}
                </TabsTrigger>
                <TabsTrigger value='followers' className='min-w-fit'>
                  {t("followers")}
                </TabsTrigger>
                <TabsTrigger value='groups' className='min-w-fit'>
                  {t("groups")}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className='flex-1 overflow-y-auto'>
              {loading && (
                <div className='flex justify-center py-12'>
                  <IconLoader2 size={24} className='animate-spin text-muted-foreground' />
                </div>
              )}

              {!loading && error && (
                <p className='px-4 py-8 text-center text-sm text-destructive'>{error}</p>
              )}

              {!loading && !error && displayedItems.length === 0 && (
                <p className='px-4 py-8 text-center text-sm text-muted-foreground'>
                  {query ? t("empty") : emptyMessage}
                </p>
              )}

              {!loading &&
                !error &&
                isProfileTab &&
                filteredProfiles.map((profile) => (
                  <ProfileRow
                    key={profile.profileId}
                    profile={profile}
                    sending={sendingId === profile.profileId}
                    onClick={() => handleShareToProfile(profile)}
                  />
                ))}

              {!loading &&
                !error &&
                recipientTab === "groups" &&
                filteredGroups.map((conv) => (
                  <GroupRow
                    key={conv._id}
                    conv={conv}
                    currentUserId={currentUserId}
                    sending={sendingId === conv._id}
                    onClick={() => handleShareToGroup(conv)}
                  />
                ))}
            </div>
          </TabsContent>

          <TabsContent
            value='external'
            className='flex flex-1 flex-col items-center justify-center px-6 py-8'
          >
            <div className='flex flex-col items-center gap-4 text-center'>
              <div className='flex h-14 w-14 items-center justify-center rounded-full bg-primary/10'>
                {copied ? (
                  <IconCheck size={28} className='text-primary' />
                ) : (
                  <IconShare3 size={28} className='text-primary' />
                )}
              </div>
              <div className='space-y-1'>
                <p className='font-medium'>{copied ? t("copied") : t("externalTitle")}</p>
                <p className='text-sm text-muted-foreground'>{t("externalDescription")}</p>
              </div>
              <Button
                onClick={handleExternalShare}
                className='w-full rounded-full'
                variant={copied ? "secondary" : "default"}
              >
                {canShareExternally ? <IconShare3 size={18} /> : <IconCopy size={18} />}
                {canShareExternally ? t("externalShare") : t("copyLink")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
