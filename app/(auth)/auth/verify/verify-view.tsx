"use client"

import * as React from "react"
import Link from "next/link"
import { CheckCircle2, Loader2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api/errors"
import { useVerifyEmail } from "@/lib/auth/use-session"

import { AuthShell } from "../auth-shell"

type Status = "working" | "done" | "failed"

export function VerifyEmailView({ token }: { token?: string }) {
  const verify = useVerifyEmail()
  const [status, setStatus] = React.useState<Status>(token ? "working" : "failed")
  const [message, setMessage] = React.useState<string>(
    token ? "" : "This link is missing its token."
  )

  // Guards against React Strict Mode running the effect twice in development.
  // The token is single-use, so a second call would consume nothing and report
  // failure for a verification that had in fact just succeeded.
  const attempted = React.useRef(false)

  const { mutateAsync } = verify

  React.useEffect(() => {
    if (!token || attempted.current) return
    attempted.current = true

    void (async () => {
      try {
        await mutateAsync(token)
        setStatus("done")
      } catch (error) {
        setStatus("failed")
        setMessage(
          error instanceof ApiError
            ? error.message
            : "We couldn't confirm this email. Please try again."
        )
      }
    })()
  }, [token, mutateAsync])

  if (status === "working") {
    return (
      <AuthShell title="Confirming your email" description="One moment.">
        <div
          className="text-muted-foreground mt-8 flex items-center gap-3 text-sm"
          role="status"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Checking your link…
        </div>
      </AuthShell>
    )
  }

  if (status === "done") {
    return (
      <AuthShell
        title="Email confirmed"
        description="Thanks — that's the last of the setup."
      >
        <div className="border-border bg-muted/40 mt-8 flex gap-3 rounded-lg border px-4 py-3 text-sm">
          <CheckCircle2
            className="text-primary mt-0.5 h-4 w-4 shrink-0"
            aria-hidden
          />
          <p className="text-muted-foreground">
            Your address is verified, so you can recover the account if you ever
            lose your password.
          </p>
        </div>

        <Button asChild className="mt-6 w-full">
          <Link href="/app">Go to Laterr</Link>
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="We couldn't confirm this link"
      description={message}
      footer={
        <>
          Already signed in? Request a fresh link from{" "}
          <Link
            href="/settings"
            className="text-foreground underline underline-offset-4"
          >
            your settings
          </Link>
          .
        </>
      }
    >
      <div className="border-destructive/30 bg-destructive/10 text-destructive mt-8 flex gap-3 rounded-lg border px-4 py-3 text-sm">
        <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          Verification links expire after 24 hours and can only be used once.
        </p>
      </div>

      <Button asChild variant="outline" className="mt-6 w-full">
        <Link href="/app">Continue to Laterr</Link>
      </Button>
    </AuthShell>
  )
}
