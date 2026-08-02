"use client"

import * as React from "react"
import Link from "next/link"
import { Loader2, MailCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api/errors"
import { useForgotPassword } from "@/lib/auth/use-session"

import { AuthShell } from "../auth-shell"

export function ForgotPasswordForm({
  initialEmail,
}: {
  initialEmail?: string
}) {
  const forgot = useForgotPassword()
  const [sentTo, setSentTo] = React.useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const email = String(
      new FormData(event.currentTarget).get("email") ?? ""
    ).trim()

    try {
      await forgot.mutateAsync(email)
      setSentTo(email)
    } catch (error) {
      // Only genuine failures land here — a rate limit or an unreachable API.
      // An unknown address still returns 204, and must keep looking identical
      // to a known one.
      if (error instanceof ApiError) {
        if (error.status === 429) {
          toast.error("Too many attempts. Try again in a few minutes.")
          return
        }

        toast.error(error.message)
        return
      }

      toast.error("Something went wrong. Please try again.")
    }
  }

  if (sentTo) {
    return (
      <AuthShell
        title="Check your inbox"
        description={
          <>
            If an account exists for <strong>{sentTo}</strong>, a reset link is
            on its way. It expires in an hour.
          </>
        }
        footer={
          <>
            Nothing arrived?{" "}
            <button
              type="button"
              className="text-foreground underline underline-offset-4"
              onClick={() => setSentTo(null)}
            >
              Try a different address
            </button>
          </>
        }
      >
        <div className="mt-8 flex gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <MailCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-primary"
            aria-hidden
          />
          <p>
            Check your spam folder before requesting another link, each new
            request invalidates the previous one.
          </p>
        </div>

        <Button asChild variant="outline" className="mt-6 w-full">
          <Link href="/auth">Back to sign in</Link>
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Reset your password"
      description="Enter the email you signed up with and we'll send you a link to choose a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link
            href="/auth"
            className="text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            defaultValue={initialEmail}
            placeholder="you@example.com"
            maxLength={200}
          />
        </div>

        <Button type="submit" className="w-full" disabled={forgot.isPending}>
          {forgot.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Send reset link
        </Button>
      </form>
    </AuthShell>
  )
}
