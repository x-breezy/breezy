import Image from "next/image"
import { cn } from "@/lib/utils"
import { UserRole } from "@/lib/auth/role"
import { UsernameDisplay } from "@/components/shared/username-display"

interface ProfilePostProps {
  id: string
  author: {
    name: string
    username: string
    avatar?: string
    role?: UserRole
  }
  content: string
  timestamp: string
}

function ProfilePost({ author, content, timestamp }: ProfilePostProps) {
  return (
    <article className='border-t py-4'>
      <div className='flex gap-3'>
        {author.avatar ? (
          <Image
            src={author.avatar}
            alt={author.name}
            width={40}
            height={40}
            className='size-10 rounded-full object-cover'
          />
        ) : (
          <div className='flex size-10 items-center justify-center rounded-full bg-muted'>
            {author.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <UsernameDisplay name={author.name} role={author.role} />
            <span className='text-sm text-muted-foreground'>@{author.username}</span>
            <span className='text-muted-foreground'>·</span>
            <span className='text-sm text-muted-foreground'>{timestamp}</span>
          </div>
          <p className='mt-1 text-sm leading-relaxed whitespace-pre-wrap'>{content}</p>
        </div>
      </div>
    </article>
  )
}

interface ProfilePostsProps {
  posts: ProfilePostProps[]
  title?: string
  className?: string
}

export function ProfilePosts({ posts, title = "Posts", className }: ProfilePostsProps) {
  return (
    <section className={cn("", className)}>
      <h2 className='mb-2 text-lg font-semibold'>{title}</h2>
      <div className='divide-y'>
        {posts.map((post) => (
          <ProfilePost key={post.id} {...post} />
        ))}
      </div>
    </section>
  )
}

export type { ProfilePostProps }
