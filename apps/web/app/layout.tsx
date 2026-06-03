import { Geist, Geist_Mono } from "next/font/google"
import "@breezy/ui/globals.css"
import type { Metadata } from "next"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { cn } from "@breezy/ui/lib/utils"

// base font
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

// monospace font
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Breezy",
    template: "%s / Breezy",
  },
  description: "The breeziest place to share what's on your mind.",
  keywords: ["breezy", "social", "posts", "feed", "timeline"],
  authors: [{ name: "Breezy" }],
  creator: "Breezy",
  openGraph: {
    type: "website",
    siteName: "Breezy",
    title: "Breezy",
    description: "The breeziest place to share what's on your mind.",
  },
  twitter: {
    card: "summary",
    title: "Breezy",
    description: "The breeziest place to share what's on your mind.",
  },
  icons: {
    icon: "/icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={cn("antialiased", geistMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
