import { ListItem, ListItemLabel, ListItemMeta } from "@/components/ui/list"

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
          <ListItem>
            <ListItemLabel>#{item.tag}</ListItemLabel>
            <ListItemMeta>{item.posts} posts</ListItemMeta>
          </ListItem>
        </li>
      ))}
    </ul>
  )
}
