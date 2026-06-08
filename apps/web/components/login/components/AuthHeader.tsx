import Image from "next/image"

interface AuthHeaderProps {
  title: string
  subtitle: string
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className='mb-8 flex flex-col items-center text-center'>
      <div className='mb-4'>
        <Image
          src='/navbar/breezy_icon.svg'
          alt='Breezy'
          width={56}
          height={56}
          className='object-contain'
          priority
        />
      </div>
      <h1 className='text-2xl font-semibold tracking-tight text-foreground'>{title}</h1>
      <p className='mt-1 text-xs text-muted-foreground'>{subtitle}</p>
    </div>
  )
}
