interface PostContentProps {
  content: string
}

export function PostContent({ content }: PostContentProps) {
  return (
    <p className='text-sm leading-tight break-words whitespace-pre-wrap text-foreground'>
      {content}
    </p>
  )
}
