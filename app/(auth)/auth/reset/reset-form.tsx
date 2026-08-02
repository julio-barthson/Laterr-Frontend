"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError } from "@/lib/api/errors"
import { useResetPassword } from "@/lib/auth/use-session"

import { AuthShell } from "../auth-shell"

/** Matches the API's ResetPasswordDto so the client rejects before a round trip. */
const MIN_PASSWORD_LENGTH = 12

export function ResetPasswordForm({
  token,
  maskedEmail,
}: {
  token: string
  maskedEmail?: string
}) {
  const router = useRouter()
  const reset = useResetPassword()
  const [errors, setErrors] = React.useState<string[]>([])

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors([])

    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    const confirm = String(form.get("confirmPassword") ?? "")

    if (password.length < MIN_PASSWORD_LENGTH) {
      setErrors([`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`])
      return
    }

    // Confirmation is client-only and deliberately not sent: the API has no use
    // for it, and a typo caught here costs nothing, while a typo caught after
    // the token is spent locks the user out for another round trip.
    if (password !== confirm) {
      setErrors(["Both passwords must match."])
      return
    }

    try {
      await reset.mutateAsync({ token, password })

      toast.success("Password updated. You're signed in.")
      router.replace("/app")
    } catch (error) {
      if (error instanceof ApiError) {
        // Covers both a rejected password and a token that expired between
        // this page rendering and the submit — the API reports both as 400,
        // and the footer offers a fresh link either way.
        if (error.isValidation && error.messages.length > 0) {
          setErrors(error.messages)
          return
        }

        toast.error(error.message)
        return
      }

      toast.error("Something went wrong. Please try again.")
    }
  }

  return (
    <AuthShell
      title="Choose a new password"
      description={
        maskedEmail ? (
          <>
            Setting a new password for <strong>{maskedEmail}</strong>. Every
            other signed-in device will be signed out.
          </>
        ) : (
          "Every other signed-in device will be signed out."
        )
      }
      footer={
        <>
          Link expired?{" "}
          <Link
            href="/auth/forgot"
            className="text-foreground underline underline-offset-4"
          >
            Request a new one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {/* Present so password managers know which account this belongs to.
            Hidden from view and from the tab order, but not from the manager. */}
        {maskedEmail && (
          <input
            type="text"
            name="username"
            autoComplete="username"
            defaultValue={maskedEmail}
            readOnly
            hidden
          />
        )}

        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            autoComplete="new-password"
            minLength={MIN_PASSWORD_LENGTH}
            maxLength={200}
          />
          <p className="text-muted-foreground text-xs">
            At least {MIN_PASSWORD_LENGTH} characters. Length matters more than
            symbols.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            maxLength={200}
          />
        </div>

        {errors.length > 0 && (
          <ul
            role="alert"
            className="border-destructive/30 bg-destructive/10 text-destructive space-y-1 rounded-lg border px-3 py-2 text-sm"
          >
            {errors.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}

        <Button type="submit" className="w-full" disabled={reset.isPending}>
          {reset.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update password and sign in
        </Button>
      </form>
    </AuthShell>
  )
}
