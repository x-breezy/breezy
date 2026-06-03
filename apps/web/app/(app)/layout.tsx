import { NavBar } from "@/components/NavBar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex h-dvh flex-col'>
      <div className='flex-1 overflow-y-auto'>{children}</div>
      <NavBar />
    </div>
  )
}
