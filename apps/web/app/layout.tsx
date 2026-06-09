import { Geist, Geist_Mono, Geom } from "next/font/google"
import "@/styles/globals.css"
import type { Metadata } from "next"
import { cookies } from "next/headers"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { cn } from "@/lib/utils"
import type { Theme } from "@/lib/theme"

// base font
const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

// monospace font
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const geom = Geom({
  subsets: ["latin"],
  variable: "--font-geom",
  fallback: ["ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const theme = (cookieStore.get("breezy-theme")?.value as Theme) ?? "system"

  return (
    <html
      lang='en'
      suppressHydrationWarning
      data-theme={theme}
      className={cn("antialiased", geistMono.variable, "font-sans", geist.variable, geom.variable)}
    >
      <body>
        <QueryProvider>
          <ThemeProvider defaultTheme={theme}>{children}</ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
