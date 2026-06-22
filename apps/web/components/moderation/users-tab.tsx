"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  IconBan,
  IconAlertTriangle,
  IconExternalLink,
  IconLockOpen,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProfileAvatar } from "@/components/profile/profile-avatar"
import { banUser, unbanUser, createUser } from "@/lib/actions/users"
import { useUserStore } from "@/stores/user-store"
import { useModerationStore } from "@/stores/moderation-store"
import type { SanctionedUser, CreateUserPayload } from "@/lib/actions/users"

type Filter = "all" | "banned"

export function UsersTab() {
  const currentUser = useUserStore((s) => s.user)
  const isAdmin = currentUser?.role === "admin"
  const users = useModerationStore((s) => s.allUsers).filter((u) => u.id !== currentUser?.id)
  const sanctions = useModerationStore((s) => s.sanctions)
  const setSanction = useModerationStore((s) => s.setSanction)
  const addUser = useModerationStore((s) => s.addUser)

  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const validUsers = users.filter((u) => !!u.id)

  function runAction(id: string, fn: () => Promise<void>, patch: { isBanned?: boolean }) {
    setActionId(id)
    setError(null)
    startTransition(async () => {
      try {
        await fn()
        setSanction(id, patch)
      } catch {
        setError("Action failed. Please try again.")
      } finally {
        setActionId(null)
      }
    })
  }

  function getVisible(filter: Filter) {
    return validUsers.filter((u) => {
      const s = sanctions[u.id] ?? { isBanned: u.isBanned }
      if (filter === "banned") return s.isBanned
      return true
    })
  }

  const bannedCount = validUsers.filter(
    (u) => (sanctions[u.id] ?? { isBanned: u.isBanned }).isBanned
  ).length

  return (
    <div>
      {error && (
        <div className='mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive'>
          <IconAlertTriangle size={16} />
          {error}
        </div>
      )}

      <Tabs defaultValue='all'>
        <div className='mb-4 flex items-center justify-between'>
          <TabsList variant='line'>
            <TabsTrigger value='all'>All ({validUsers.length})</TabsTrigger>
            <TabsTrigger value='banned'>Banned ({bannedCount})</TabsTrigger>
          </TabsList>

          {isAdmin && (
            <Button size='sm' onClick={() => setDialogOpen(true)}>
              <IconUserPlus size={15} />
              Add user
            </Button>
          )}
        </div>

        {(["all", "banned"] as Filter[]).map((filter) => {
          const visible = getVisible(filter)
          return (
            <TabsContent key={filter} value={filter}>
              {visible.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
                  <IconUsers size={40} className='mb-3 opacity-40' />
                  <p className='text-sm'>No users found.</p>
                </div>
              ) : (
                <ul className='space-y-3'>
                  {visible.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      sanction={sanctions[user.id] ?? { isBanned: user.isBanned }}
                      isAdmin={isAdmin}
                      isPending={isPending}
                      actionId={actionId}
                      runAction={runAction}
                    />
                  ))}
                </ul>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      {isAdmin && (
        <AddUserDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onCreated={(user) => {
            addUser(user)
            setDialogOpen(false)
          }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// UserCard
// ---------------------------------------------------------------------------

interface UserCardProps {
  user: SanctionedUser
  sanction: { isBanned: boolean }
  isAdmin: boolean
  isPending: boolean
  actionId: string | null
  runAction: (id: string, fn: () => Promise<void>, patch: { isBanned?: boolean }) => void
}

function UserCard({ user, sanction, isAdmin, isPending, actionId, runAction }: UserCardProps) {
  const loading = isPending && actionId === user.id

  return (
    <li className='flex items-center gap-3 rounded-xl py-2'>
      <ProfileAvatar size='2xs' src={user.avatarUrl ?? undefined} />

      <div className='min-w-0 flex-1'>
        <div className='mb-0.5 flex flex-wrap items-center gap-2'>
          <Link
            href={`/profile/${user.username}`}
            className='inline-flex items-center gap-1 font-semibold hover:underline'
          >
            @{user.username}
            <IconExternalLink size={12} />
          </Link>
          {sanction.isBanned && (
            <span className='inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400'>
              <IconBan size={11} />
              Banned
            </span>
          )}
          <span className='rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground'>
            {user.role}
          </span>
        </div>
        <p className='text-xs text-muted-foreground'>{user.email}</p>
      </div>

      <div className='flex shrink-0 flex-wrap items-center gap-2'>
        {isAdmin && sanction.isBanned && (
          <Button
            variant='outline'
            size='xs'
            onClick={() => runAction(user.id, () => unbanUser(user.id), { isBanned: false })}
            disabled={loading}
            className='border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20'
          >
            <IconLockOpen />
            {loading ? "…" : "Unban"}
          </Button>
        )}
        {isAdmin && !sanction.isBanned && (
          <Button
            variant='destructive'
            size='xs'
            onClick={() => runAction(user.id, () => banUser(user.id), { isBanned: true })}
            disabled={loading}
          >
            <IconBan />
            {loading ? "…" : "Ban"}
          </Button>
        )}
      </div>
    </li>
  )
}

// ---------------------------------------------------------------------------
// AddUserDialog
// ---------------------------------------------------------------------------

interface AddUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (user: SanctionedUser) => void
}

function AddUserDialog({ open, onOpenChange, onCreated }: AddUserDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState<CreateUserPayload>({
    username: "",
    email: "",
    password: "",
    role: "user",
  })

  function handleChange(field: keyof CreateUserPayload, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    startTransition(async () => {
      try {
        const user = await createUser(form)
        onCreated(user)
        setForm({ username: "", email: "", password: "", role: "user" })
      } catch (err) {
        setFormError(
          err instanceof Error ? err.message : "Failed to create user. Please try again."
        )
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add user</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          {formError && (
            <div className='flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
              <IconAlertTriangle size={15} />
              {formError}
            </div>
          )}

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='add-username'>Username</Label>
            <Input
              id='add-username'
              placeholder='johndoe'
              value={form.username}
              onChange={(e) => handleChange("username", e.target.value)}
              required
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='add-email'>Email</Label>
            <Input
              id='add-email'
              type='email'
              placeholder='john@example.com'
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='add-password'>Password</Label>
            <Input
              id='add-password'
              type='password'
              placeholder='••••••••'
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <Label htmlFor='add-role'>Role</Label>
            <Select
              value={form.role}
              onValueChange={(value) => handleChange("role", value ?? "user")}
            >
              <SelectTrigger id='add-role' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='user'>User</SelectItem>
                <SelectItem value='moderator'>Moderator</SelectItem>
                <SelectItem value='admin'>Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter showCloseButton>
            <Button type='submit' disabled={isPending}>
              {isPending ? "Creating…" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
