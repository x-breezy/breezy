import type { Metadata } from "next"
import SignInScreen from "@/components/auth/sign-in"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Breezy account.",
}

interface Props {
  searchParams: Promise<{ reason?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const { reason } = await searchParams
  return <SignInScreen reason={reason} />
}
