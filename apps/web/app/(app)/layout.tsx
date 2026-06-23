import type { Metadata } from "next"
import { AppLayout } from "@/components/layout/app-layout"

export const metadata: Metadata = {
  description: "Your Breezy feed, messages, notifications, and more.",
}

export default function ApplicationLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}
