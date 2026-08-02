"use client"

import * as React from "react"
import { Loader2, MailWarning } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ApiError } from "@/lib/api/errors"
import { useResendVerification, useSession } from "@/lib/auth/use-session"

/**
 * Prompt to confirm the account's email address.
 *
 * Advisory only — nothing in the app is gated on verification, so this renders
 * nothing once the address is confirmed and never blocks the page. It is also
 * hidden while the session is loading, so a verified user does not see it flash
 * on every navigation.
 */
export function VerifyEmailCard() {
  const { user, isLoading } = useSession()
  const resend = useResendVerification()
  const [sent, setSent] = React.useState(false)

  if (isLoading || !user || user.emailVerified !== false) {
    return null
  }

  async function onResend() {
    try {
      await resend.mutateAsync()
      setSent(true)
      toast.success("Confirmation link sent.")
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        toast.error("Too many requests. Try again in a few minutes.")
        return
      }

      toast.error("Couldn't send the link. Please try again.")
    }
  }

  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MailWarning className="h-4 w-4 text-amber-600" aria-hidden />
          Confirm your email
        </CardTitle>
        <CardDescription>
          We sent a link to <strong>{user.email}</strong>. Confirming it is what
          lets you reset your password if you ever lose it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => void onResend()}
          disabled={resend.isPending || sent}
        >
          {resend.isPending && (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          )}
          {sent ? "Link sent — check your inbox" : "Resend the link"}
        </Button>
      </CardContent>
    </Card>
  )
}
