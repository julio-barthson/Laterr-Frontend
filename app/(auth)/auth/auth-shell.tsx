import * as React from "react"
import Link from "next/link"

import { Logo } from "@/components/logo"

/**
 * The centred card every auth screen sits in — sign in, forgot, reset, verify.
 *
 * Extracted so the recovery pages cannot drift from the sign-in page they hand
 * the user back to. A reset flow that looks subtly unlike the rest of the app
 * reads as a phishing page, which is the last impression this particular
 * journey can afford.
 */
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="bg-background min-h-svh">
      <div className="mx-auto grid min-h-svh max-w-6xl place-items-center px-6 py-16">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center"
            aria-label="Laterr home"
          >
            <Logo className="h-9" priority />
          </Link>

          <h1 className="font-heading text-3xl">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2 text-sm">{description}</p>
          )}

          {children}

          {footer && (
            <p className="text-muted-foreground mt-8 text-center text-sm">
              {footer}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
