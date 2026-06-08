import Image from "next/image"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='flex min-h-svh'>
      <div className='flex flex-1 items-center justify-center px-6 py-12'>{children}</div>

      <div className='m-8 hidden flex-1 flex-col items-center justify-center gap-6 rounded-4xl bg-auth-panel lg:flex'>
        <div className='relative h-80 w-80'>
          <Image
            src='/vecteurs-login.svg'
            alt='Breezy'
            fill
            className='object-contain opacity-90'
          />
        </div>
        <div className='text-center'>
          <p className='mt-1 text-2xl'>Share your world, simply with</p>

          <p className='font-mono text-2xl font-semibold tracking-tight text-foreground'>Breezy</p>
        </div>
      </div>
    </div>
  )
}
