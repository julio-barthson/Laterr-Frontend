import Link from "next/link"

import { Logo } from "@/components/logo"

/**
 * Chrome for pages that must work signed in *or* out — booking links and the
 * token-addressed management pages. Deliberately minimal: an invitee is here to
 * pick a time, not to be sold the product.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background min-h-svh">
      <header className="border-border/40 border-b">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center" aria-label="Laterr home">
            <Logo className="h-7" priority />
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>

      <footer className="border-border/40 border-t">
        <div className="text-muted-foreground mx-auto max-w-5xl px-4 py-6 text-xs sm:px-6">
          Scheduling by{" "}
          <Link href="/" className="hover:text-foreground underline">
            Laterr
          </Link>
        </div>
      </footer>
    </div>
  )
}
