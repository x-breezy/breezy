import { IconDots } from "@tabler/icons-react"
import { NotificationsHeader } from "@/components/notifications/NotificationsHeader"

interface Notification {
  id: string
  handle: string
  time: string
  message: string
  initials: string
  color: string
}

const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    handle: "alexandre_t",
    time: "2h",
    message:
      "A répondu à votre post : \"C'est exactement le problème que j'ai eu sur Safari hier, merci pour l'astuce !\"",
    initials: "A",
    color: "bg-sky-600",
  },
  {
    id: "2",
    handle: "sophie_ux",
    time: "3h",
    message:
      'vous a mentionné dans une publication : "Tu devrais regarder ce thread @grod_le_goat, c\'est très pertinent."',
    initials: "S",
    color: "bg-rose-500",
  },
  {
    id: "3",
    handle: "clara_dev et 12 autres personnes",
    time: "2h",
    message: "ont aimé votre post.",
    initials: "C",
    color: "bg-violet-600",
  },
  {
    id: "4",
    handle: "alexandre_t",
    time: "2h",
    message:
      "A répondu à votre post : \"C'est exactement le problème que j'ai eu sur Safari hier, merci pour l'astuce !\"",
    initials: "A",
    color: "bg-sky-600",
  },
  {
    id: "5",
    handle: "alexandre_t",
    time: "2h",
    message:
      "A répondu à votre post : \"C'est exactement le problème que j'ai eu sur Safari hier, merci pour l'astuce !\"",
    initials: "A",
    color: "bg-sky-600",
  },
  {
    id: "6",
    handle: "alexandre_t",
    time: "5h",
    message:
      "A répondu à votre post : \"C'est exactement le problème que j'ai eu sur Safari hier, merci pour l'astuce !\"",
    initials: "A",
    color: "bg-sky-600",
  },
]

export default function NotificationsPage() {
  return (
    <div>
      <NotificationsHeader />
      <ul>
        {NOTIFICATIONS.map((notif) => (
          <li key={notif.id} className='flex gap-3 border-b px-4 py-4'>
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${notif.color}`}
            >
              {notif.initials}
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex items-start justify-between gap-2'>
                <p className='text-sm'>
                  <span className='font-semibold'>@{notif.handle}</span>
                  {notif.time && <span className='text-muted-foreground'> · {notif.time}</span>}
                </p>
                <button
                  aria-label='Notification actions'
                  className='shrink-0 text-muted-foreground'
                >
                  <IconDots size={16} />
                </button>
              </div>
              <p className='mt-0.5 text-sm text-muted-foreground'>{notif.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
