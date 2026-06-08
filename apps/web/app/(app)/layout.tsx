import { AppLayout } from "@/components/layout/app-layout"

export default function ApplicationLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return <AppLayout modal={modal}>{children}</AppLayout>
}
