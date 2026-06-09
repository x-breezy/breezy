import { ProfilePosts, type ProfilePostProps } from "./profile-posts"
import { cn } from "@/lib/utils"

interface ProfilePostsSectionProps {
  posts: ProfilePostProps[]
  title?: string
  className?: string
}

export function ProfilePostsSection({ posts, title, className }: ProfilePostsSectionProps) {
  return (
    <section className={cn("mx-auto max-w-4xl p-4 md:p-0", className)}>
      <ProfilePosts posts={posts} title={title} />
    </section>
  )
}
