import { IconDots } from "@tabler/icons-react"

export function PostMenu() {
  return (
    <button
      aria-label='More options'
      className='-mr-1 p-1 text-muted-foreground transition hover:text-foreground'
      onClick={() => {
        // TODO: Implement menu dropdown
        console.log("Open menu")
      }}
    >
      <IconDots className='size-4' aria-hidden='true' />
    </button>
  )
}
