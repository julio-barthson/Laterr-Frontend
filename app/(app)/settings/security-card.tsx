"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/errors"
import { useChangePassword, useSession } from "@/lib/auth/use-session"

/** Matches the API's ChangePasswordDto. */
const MIN_PASSWORD_LENGTH = 12

/**
 * Password management for the signed-in user.
 *
 * Doubles as "set a password" for a Google-only account, which has no current
 * password to confirm — `hasPassword` from /auth/me is what distinguishes the
 * two, and the API accepts an empty `currentPassword` in that case.
 */
export function SecurityCard() {
  const { user } = useSession()
  const change = useChangePassword()
  const formRef = React.useRef<HTMLFormElement>(null)
  const [errors, setErrors] = React.useState<string[]>([])

  // Undefined while /auth/me is in flight. Default to the safer of the two
  // shapes — asking for a current password the account may not have is a worse
  // first impression than the reverse, but it is corrected on load either way.
  const hasPassword = user?.hasPassword ?? true

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors([])

    const form = new FormData(event.currentTarget)
    const currentPassword = String(form.get("currentPassword") ?? "")
    const newPassword = String(form.get("newPassword") ?? "")
    const confirmPassword = String(form.get("confirmPassword") ?? "")

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setErrors([`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`])
      return
    }

    if (newPassword !== confirmPassword) {
      setErrors(["Both new passwords must match."])
      return
    }

    if (hasPassword && newPassword === currentPassword) {
      setErrors(["That is already your current password."])
      return
    }

    try {
      await change.mutateAsync({ currentPassword, newPassword })

      // The response re-issued this device's cookies, so the session survives.
      formRef.current?.reset()
      toast.success(
        hasPassword
          ? "Password changed. Other devices have been signed out."
          : "Password set. You can now sign in without Google."
      )
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.isValidation && error.messages.length > 0) {
          setErrors(error.messages)
          return
        }

        if (error.isUnauthorized) {
          setErrors(["That current password is not right."])
          return
        }

        if (error.status === 429) {
          setErrors(["Too many attempts. Try again in a few minutes."])
          return
        }

        toast.error(error.message)
        return
      }

      toast.error("Something went wrong. Please try again.")
    }
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{hasPassword ? "Password" : "Set a password"}</CardTitle>
        <CardDescription>
          {hasPassword
            ? "Changing this signs you out everywhere else, immediately."
            : "Your account signs in with Google. Add a password so you can get in without it."}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          {/* Tells password managers which account these credentials belong to. */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            defaultValue={user?.email ?? ""}
            readOnly
            hidden
          />

          {hasPassword && (
            <Field>
              <FieldLabel htmlFor="currentPassword">
                Current password
              </FieldLabel>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                autoComplete="current-password"
                maxLength={200}
              />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="newPassword">New password</FieldLabel>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={200}
            />
            <FieldDescription>
              At least {MIN_PASSWORD_LENGTH} characters. Length matters more
              than symbols.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">
              Confirm new password
            </FieldLabel>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              maxLength={200}
            />
          </Field>

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

          <Button
            type="submit"
            className="rounded-full"
            disabled={change.isPending}
          >
            {change.isPending && (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            {hasPassword ? "Change password" : "Set password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
