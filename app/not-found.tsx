import type { Metadata } from "next"
import Link from "next/link"
import { Compass } from "lucide-react"

import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="bg-primary/10 text-primary grid h-14 w-14 place-items-center rounded-2xl">
        <Compass className="h-6 w-6" />
      </span>
      <h1 className="font-heading text-3xl">This page isn&apos;t here</h1>
      <p className="text-muted-foreground text-sm">
        The link may be old, or the page may have moved.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button asChild className="rounded-full">
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/app">Open Laterr</Link>
        </Button>
      </div>
    </main>
  )
}
