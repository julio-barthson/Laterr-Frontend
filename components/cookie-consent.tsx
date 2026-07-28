"use client"

import * as React from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

const STORAGE_KEY = "laterr.cookie-consent"

/**
 * localStorage as a React external store.
 *
 * This is what useSyncExternalStore is for. The alternative — useState plus an
 * effect that reads storage — trips React 19's set-state-in-effect rule, costs
 * an extra render, and flashes the banner at returning visitors before it is
 * dismissed.
 *
 * The browser's own `storage` event does not fire in the tab that made the
 * change, so accepting notifies local subscribers directly.
 */
const listeners = new Set<() => void>()

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  // Still listen to the native event so accepting in one tab hides the banner
  // in the others.
  window.addEventListener("storage", onChange)

  return () => {
    listeners.delete(onChange)
    window.removeEventListener("storage", onChange)
  }
}

function hasAccepted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "accepted"
  } catch {
    // Storage access throws outright in some private modes. Treat that as
    // "not accepted" rather than crashing the page.
    return false
  }
}

/** On the server, report accepted so the banner is never in the SSR markup. */
function acceptedOnServer(): boolean {
  return true
}

function accept() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "accepted")
  } catch {
    // Nothing to do — the banner reappears next visit.
  }

  for (const listener of listeners) listener()
}

export function CookieConsent() {
  const accepted = React.useSyncExternalStore(
    subscribe,
    hasAccepted,
    acceptedOnServer
  )

  if (accepted) return null

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="border-border bg-card/95 fixed inset-x-3 bottom-3 z-40 mx-auto max-w-3xl rounded-2xl border p-4 shadow-lg backdrop-blur sm:inset-x-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground min-w-0 text-sm">
          We use only the cookies needed to keep you signed in. Read the{" "}
          <Link href="/cookies" className="text-foreground underline">
            cookie policy
          </Link>
          .
        </p>
        <Button size="sm" className="rounded-full" onClick={accept}>
          Got it
        </Button>
      </div>
    </div>
  )
}
