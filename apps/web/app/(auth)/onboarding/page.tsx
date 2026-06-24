import type { Metadata } from "next"
import OnboardingScreen from "@/components/auth/onboarding-screen"

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Set up your Breezy profile and preferences.",
}

export default function OnboardingPage() {
  return <OnboardingScreen />
}
