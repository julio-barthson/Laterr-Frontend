import type { Metadata, Viewport } from "next"
import { Geist_Mono, Outfit } from "next/font/google"

import "./globals.css"
import { Providers } from "@/components/providers"
import { siteUrl } from "@/lib/site"
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

/**
 * Site-wide defaults.
 *
 * `metadataBase` is the important one: without it every `alternates.canonical`
 * on the marketing pages is a bare path with nothing to resolve against, so the
 * canonical tags were being emitted relative or dropped entirely.
 *
 * The title template means a page only has to name itself — pages that set no
 * title at all still get "Laterr" rather than nothing.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Laterr — scheduling that actually knows you",
    template: "%s | Laterr",
  },
  description:
    "An AI-powered scheduling ecosystem: bookings, reminders, and warm follow-ups that sound like a friend rather than a robot.",
  applicationName: "Laterr",
  openGraph: {
    type: "website",
    siteName: "Laterr",
    title: "Laterr — scheduling that actually knows you",
    description:
      "An AI-powered scheduling ecosystem: bookings, reminders, and warm follow-ups.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Laterr",
    description:
      "An AI-powered scheduling ecosystem: bookings, reminders, and warm follow-ups.",
  },
  // Signed-in surfaces set their own `robots: { index: false }`; this is the
  // default for the public pages.
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  // Matches the brand primary compiled from globals.css, so the mobile browser
  // chrome does not sit against an unrelated colour.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#008fdb" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        "scrollbar-none",
        outfit.variable
      )}
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
