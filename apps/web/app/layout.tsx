import { Geist, Geist_Mono } from "next/font/google"
import "@breezy/ui/globals.css"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { cn } from "@breezy/ui/lib/utils"

// base font
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

// monospace font
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

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
