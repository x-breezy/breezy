const TAGS = [
  { tag: "WebDev", posts: "12.4k" },
  { tag: "TypeScript", posts: "9.8k" },
  { tag: "OpenSource", posts: "8.1k" },
  { tag: "BreezyUpdate", posts: "7.3k" },
  { tag: "TailwindCSS", posts: "6.5k" },
  { tag: "NextJS", posts: "5.9k" },
  { tag: "React", posts: "5.4k" },
  { tag: "UXDesign", posts: "4.7k" },
  { tag: "Frontend", posts: "3.9k" },
  { tag: "DevOps", posts: "3.2k" },
]

export function TagList() {
  return (
    <ul className='py-3'>
      {TAGS.map((item) => (
        <li key={item.tag}>
          <button className='flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-muted'>
            <span className='text-base font-medium'>#{item.tag}</span>
            <span className='text-sm text-muted-foreground'>{item.posts} posts</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
