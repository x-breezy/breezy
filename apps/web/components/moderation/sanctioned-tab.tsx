"use client"

import { useState, useTransition } from "react"
import { IconCheck, IconAlertTriangle } from "@tabler/icons-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useUserStore } from "@/stores/user-store"
import { useModerationStore } from "@/stores/moderation-store"
import SanctionedUserCard from "./sanctioned-user-card"

type Filter = "all" | "banned"

export function SanctionedTab() {
  const isAdmin = useUserStore((s) => s.user?.role) === "admin"
  const users = useModerationStore((s) => s.sanctionedUsers)
  const sanctions = useModerationStore((s) => s.sanctions)
  const setSanction = useModerationStore((s) => s.setSanction)
  const [isPending, startTransition] = useTransition()
  const [actionId, setActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    return users.filter((u) => {
      const s = sanctions[u.id] ?? { isBanned: u.isBanned }
      if (filter === "banned") return s.isBanned
      return true
    })
  }

  return (
    <div>
      {error && (
        <div className='mb-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive'>
          <IconAlertTriangle size={16} />
          {error}
        </div>
      )}

      <Tabs defaultValue='all'>
        <TabsList variant='line' className='mb-4'>
          <TabsTrigger value='all'>All</TabsTrigger>
          <TabsTrigger value='banned'>Banned</TabsTrigger>
        </TabsList>

        {(["all", "banned"] as Filter[]).map((filter) => {
          const visible = getVisible(filter)
          return (
            <TabsContent key={filter} value={filter}>
              {visible.length === 0 ? (
                <div className='flex flex-col items-center justify-center py-16 text-muted-foreground'>
                  <IconCheck size={40} className='mb-3 opacity-40' />
                  <p className='text-sm'>No sanctioned users found.</p>
                </div>
              ) : (
                <ul className='space-y-3'>
                  {visible.map((user) => (
                    <SanctionedUserCard
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
    </div>
  )
}
