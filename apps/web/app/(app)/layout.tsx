import { AppLayout as AppLayoutShell } from "@/components/AppLayout"

export default function AppLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return <AppLayoutShell modal={modal}>{children}</AppLayoutShell>
}
