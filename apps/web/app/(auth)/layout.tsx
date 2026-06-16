import Image from "next/image"
import { AuthLanguageSelect } from "@/components/auth/auth-language-select"

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='flex min-h-svh select-none'>
      <div className='flex flex-1 animate-in flex-col items-center justify-center px-6 py-12'>
        {children}
        <AuthLanguageSelect />
      </div>

      <div className='m-8 hidden flex-1 flex-col items-center justify-center gap-6 rounded-4xl bg-auth-panel lg:flex'>
        <div className='relative h-80 w-80'>
          <Image
            src='/images/vector-welcome.svg'
            alt='Breezy'
            fill
            className='object-contain opacity-90'
            loading='eager'
          />
        </div>
        <div className='text-center'>
          <p className='mt-1 text-2xl text-foreground'>Share your world, simply with</p>

          <p className='font-geom text-2xl font-semibold tracking-tight text-foreground'>Breezy</p>
        </div>
      </div>
    </div>
  )
}
