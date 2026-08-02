import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/lib/api/config"

import { AuthShell } from "../auth-shell"
import { ResetPasswordForm } from "./reset-form"

export const metadata: Metadata = {
  title: "Choose a new password — Laterr",
  robots: { index: false, follow: false },
}

interface TokenState {
  valid: boolean
  email?: string
}

/**
 * Check the link before rendering the form.
 *
 * Done on the server so an expired link says so immediately, rather than after
 * the user has picked and confirmed a password. `cache: "no-store"` because the
 * answer changes the moment the token is used.
 */
async function inspectToken(token: string): Promise<TokenState> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/auth/reset-password/${encodeURIComponent(token)}`,
      { cache: "no-store" }
    )

    if (!response.ok) return { valid: false }

    return (await response.json()) as TokenState
  } catch {
    // The API being unreachable is not the same as the link being bad, but
    // there is nothing useful the form could do either way.
    return { valid: false }
  }
}

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await props.searchParams
  const state = token ? await inspectToken(token) : { valid: false }

  if (!token || !state.valid) {
    return (
      <AuthShell
        title="This link has expired"
        description="Reset links last an hour and can only be used once. Request a new one and it will arrive in a moment."
      >
        <div className="mt-8 space-y-3">
          <Button asChild className="w-full">
            <Link href="/auth/forgot">Request a new link</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth">Back to sign in</Link>
          </Button>
        </div>
      </AuthShell>
    )
  }

  return <ResetPasswordForm token={token} maskedEmail={state.email} />
}
