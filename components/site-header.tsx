"use client"

import * as React from "react"
import Link from "next/link"

import { Logo } from "@/components/logo"
import { useSession } from "@/lib/auth/use-session"
import { Menu } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

/** The original's navigation, labels included. */
const LINKS = [
  { href: "/", label: "Home" },
  { href: "/pricing", label: "Pricing" },
  { href: "/chat", label: "Laterr AI" },
  { href: "/schedule-now", label: "Schedule Now" },
  { href: "/contact", label: "Contact us" },
  { href: "/faq", label: "FAQs" },
] as const

export function SiteHeader() {
  const [open, setOpen] = React.useState(false)
  const { user } = useSession()

  return (
    <header className="border-border/40 bg-background/70 sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        {/* Above the fold on every marketing page, so it is the one instance
            worth preloading. */}
        <Link href="/" className="flex items-center" aria-label="Laterr home">
          <Logo className="h-8" priority />
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {/* Signed-in visitors get a way back into the app rather than being
              asked to sign in again — the original did the same. */}
          {user ? (
            <Button asChild className="rounded-full">
              <Link href="/app">Open app</Link>
            </Button>
          ) : (
            <>
              <Button size='md' asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/auth">Sign in</Link>
              </Button>
              <Button size='md' asChild className="rounded-full">
                <Link href="/auth">Get started</Link>
              </Button>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetTitle className="font-heading text-lg">Laterr</SheetTitle>
              <nav className="mt-6 flex flex-col gap-1">
                {LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="hover:bg-accent rounded-lg px-3 py-2 text-sm"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/auth"
                  onClick={() => setOpen(false)}
                  className="hover:bg-accent rounded-lg px-3 py-2 text-sm"
                >
                  Sign in
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
