"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Catches a thrown render anywhere below the root layout.
 *
 * Without this a client-side exception blanks the page: React unmounts the tree
 * and Next has nothing to put in its place. This keeps the shell and offers a
 * way out.
 *
 * `error.digest` is the only detail shown. The message can carry internals, and
 * in production Next replaces it with a generic string anyway — the digest is
 * what correlates with the server log.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Logged rather than swallowed, so a real failure is visible in the browser
    // console during development and to any error reporter later.
    console.error(error)
  }, [error])

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <span className="bg-destructive/10 text-destructive grid h-14 w-14 place-items-center rounded-2xl">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="font-heading text-3xl">Something went wrong</h1>
      <p className="text-muted-foreground text-sm">
        That page failed to load. Trying again often fixes it.
      </p>
      {error.digest && (
        <p className="text-muted-foreground font-mono text-xs">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button onClick={reset} className="rounded-full">
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Try again
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/app">Back to Laterr</Link>
        </Button>
      </div>
    </main>
  )
}
