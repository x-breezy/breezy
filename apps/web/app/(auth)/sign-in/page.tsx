import type { Metadata } from "next"
import SignInScreen from "@/components/auth/sign-in"

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Breezy account.",
}

export default function LoginPage() {
  return <SignInScreen />
}
