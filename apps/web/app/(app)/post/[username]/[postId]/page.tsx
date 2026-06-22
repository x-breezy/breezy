import type { Metadata } from "next"
import { PostPageClient } from "./post-page-client"
import { ScrollArea } from "@/components/ui/scroll-area"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string; postId: string }>
}): Promise<Metadata> {
  const { username } = await params
  return {
    title: `Post by @${username}`,
    description: `View a post by ${username} on Breezy.`,
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ username: string; postId: string }>
}) {
  const { username, postId } = await params
  return (
    <ScrollArea className='h-full'>
      <PostPageClient username={username} postId={postId} />
    </ScrollArea>
  )
}
