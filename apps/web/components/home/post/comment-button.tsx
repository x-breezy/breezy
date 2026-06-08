import { IconMessageCircle } from "@tabler/icons-react"

interface CommentButtonProps {
  count: number
}

export function CommentButton({ count }: CommentButtonProps) {
  return (
    <button
      aria-label={`${count} comments. Open comments.`}
      className='flex items-center gap-1 text-xs text-muted-foreground transition select-none active:text-blue-500'
      onClick={() => {
        // TODO: Implement comment modal
        console.log("Open comments")
      }}
    >
      <IconMessageCircle size={18} stroke={2} className='shrink-0' aria-hidden='true' />
      <span aria-label={`${count} comments`}>{count}</span>
    </button>
  )
}
