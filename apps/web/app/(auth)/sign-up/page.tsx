import type { Metadata } from "next"
import SignUpScreen from "@/components/auth/sign-up"

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Breezy account.",
}

export default function SignUpPage() {
  return <SignUpScreen />
}
