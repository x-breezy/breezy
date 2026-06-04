import { IconDots } from "@tabler/icons-react"
import { NotificationsHeader } from "@/components/notifications/NotificationsHeader"
import { Button } from "@breezy/ui/components/button"
import { Avatar, AvatarFallback, AvatarImage } from "@breezy/ui/components/avatar"

interface Notification {
  id: string
  handle: string
  time: string
  message: string
  color: string
  image?: string
}

const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    handle: "alexandre_t",
    time: "2h",
    message:
      "A répondu à votre post : \"C'est exactement le problème que j'ai eu sur Safari hier, merci pour l'astuce !\"",
    color: "bg-sky-600",
    image: "https://api.dicebear.com/10.x/glyphs/svg?seed=alexandre",
  },
  {
    id: "2",
    handle: "sophie_ux",
    time: "3h",
    message:
      'vous a mentionné dans une publication : "Tu devrais regarder ce thread @grod_le_goat, c\'est très pertinent."',
    color: "bg-rose-500",
    image: "https://api.dicebear.com/10.x/glyphs/svg?seed=sophie",
  },
  {
    id: "3",
    handle: "clara_dev et 12 autres personnes",
    time: "2h",
    message: "ont aimé votre post.",
    color: "bg-violet-600",
    image: "https://api.dicebear.com/10.x/glyphs/svg?seed=clara",
  },
  {
    id: "4",
    handle: "alexandre_t",
    time: "2h",
    message:
      "A répondu à votre post : \"C'est exactement le problème que j'ai eu sur Safari hier, merci pour l'astuce !\"",
    color: "bg-sky-600",
    image: "https://api.dicebear.com/10.x/glyphs/svg?seed=alexandre",
  },
  {
    id: "5",
    handle: "alexandre_t",
    time: "2h",
    message:
      "A répondu à votre post : \"C'est exactement le problème que j'ai eu sur Safari hier, merci pour l'astuce !\"",
    color: "bg-sky-600",
    image: "https://api.dicebear.com/10.x/glyphs/svg?seed=alexandre",
  },
  {
    id: "6",
    handle: "alexandre_t",
    time: "5h",
    message:
      "A répondu à votre post : \"C'est exactement le problème que j'ai eu sur Safari hier, merci pour l'astuce !\"",
    color: "bg-sky-600",
    image: "https://api.dicebear.com/10.x/glyphs/svg?seed=alexandre",
  },
]

export default function NotificationsPage() {
  return (
    <div>
      <NotificationsHeader />
      <ul>
        {NOTIFICATIONS.map((notif) => (
          <li key={notif.id} className='flex gap-3 border-b px-4 py-4'>
            <Avatar>
              <AvatarImage src={notif.image} alt={notif.handle} />
              <AvatarFallback>{notif.handle.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className='w-full flex-1'>
              <div className='flex items-center justify-between gap-2'>
                <p className='text-sm'>
                  <span className='font-semibold'>@{notif.handle}</span>
                  {notif.time && <span className='text-muted-foreground'> · {notif.time}</span>}
                </p>
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label='Notification actions'
                  className='shrink-0 text-muted-foreground'
                >
                  <IconDots size={16} />
                </Button>
              </div>
              <p className='mt-0.5 text-sm text-muted-foreground'>{notif.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
