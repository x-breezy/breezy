import { Suspense } from "react"
import type { Metadata } from "next"
import { ProfilePageClient } from "@/components/profile/profile-page-client"
import { ScrollArea } from "@/components/ui/scroll-area"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>
}): Promise<Metadata> {
  const { username } = await params
  return {
    title: `@${username}`,
    description: `Profile of ${username} on Breezy.`,
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return (
    <ScrollArea className='h-full'>
      <Suspense>
        <ProfilePageClient username={username.toLowerCase()} />
      </Suspense>
    </ScrollArea>
  )
}
