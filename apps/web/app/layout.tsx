import { Geist, Geist_Mono, Geom } from "next/font/google"
import "@/styles/globals.css"
import type { Metadata, Viewport } from "next"
import { cookies } from "next/headers"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import type { Theme } from "@/lib/theme"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

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
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Breezy",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ca3500" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const theme = (cookieStore.get("breezy-theme")?.value as Theme) ?? "system"
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      data-theme={theme}
      className={cn("antialiased", geistMono.variable, "font-sans", geist.variable, geom.variable)}
    >
      <script
        defer
        src='https://analytics.clementomnes.dev/script.js'
        data-website-id='6939785e-0a27-4342-be0d-e00255f19f03'
      ></script>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <ThemeProvider defaultTheme={theme}>
              {children}
              <Toaster position='top-center' />
            </ThemeProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
