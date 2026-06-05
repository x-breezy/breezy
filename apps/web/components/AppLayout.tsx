"use client"

import { NavBar } from "./NavBar"

interface AppLayoutProps {
  children: React.ReactNode
  modal: React.ReactNode
}

export function AppLayout({ children, modal }: AppLayoutProps) {
  return (
    <div className='flex h-dvh'>
      <NavBar />
      <main className='flex-1 overflow-y-auto pb-15 lg:pb-0 lg:pl-64'>{children}</main>
      {modal}
    </div>
  )
}
