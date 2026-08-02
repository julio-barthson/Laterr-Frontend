"use client"

import * as React from "react"
import Link from "next/link"

import { Logo } from "@/components/logo"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { API_BASE_URL } from "@/lib/api/config"
import { ApiError } from "@/lib/api/errors"
import { useLogin, useRegister } from "@/lib/auth/use-session"

type Mode = "signin" | "signup"

/** Matches the API's RegisterDto so the client rejects before a round trip. */
const USERNAME_PATTERN = /^[a-z0-9_-]{3,40}$/
const MIN_PASSWORD_LENGTH = 12

export function AuthForm({ next }: { next?: string }) {
  const router = useRouter()
  const [mode, setMode] = React.useState<Mode>("signin")
  const [fieldErrors, setFieldErrors] = React.useState<string[]>([])

  const login = useLogin()
  const register = useRegister()
  const pending = login.isPending || register.isPending

  const destination = safeDestination(next)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFieldErrors([])

    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "").trim()
    const password = String(form.get("password") ?? "")

    try {
      if (mode === "signup") {
        const username = String(form.get("username") ?? "")
          .trim()
          .toLowerCase()

        if (password.length < MIN_PASSWORD_LENGTH) {
          setFieldErrors([
            `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
          ])
          return
        }

        if (username && !USERNAME_PATTERN.test(username)) {
          setFieldErrors([
            "Username must be 3–40 characters: lowercase letters, numbers, hyphens or underscores.",
          ])
          return
        }

        await register.mutateAsync({
          email,
          password,
          displayName: String(form.get("displayName") ?? "").trim() || undefined,
          username: username || undefined,
          phone: String(form.get("phone") ?? "").trim() || undefined,
          // Send the browser's zone so availability defaults sensibly rather
          // than falling back to the server's.
          timezone: browserTimezone(),
        })

        toast.success("Welcome to Laterr.")
      } else {
        await login.mutateAsync({ email, password })
      }

      router.replace(destination)
    } catch (error) {
      if (error instanceof ApiError) {
        // Validation failures arrive as an array; render them all rather than
        // just the first.
        if (error.isValidation && error.messages.length > 0) {
          setFieldErrors(error.messages)
          return
        }

        toast.error(error.message)
        return
      }

      toast.error("Something went wrong. Please try again.")
    }
  }

  function startGoogle() {
    // A full navigation, not fetch: the API redirects to Google, which will not
    // honour a CORS preflight.
    const url = new URL(`${API_BASE_URL}/auth/google`)
    if (destination !== "/app") {
      url.searchParams.set("next", destination)
    }
    window.location.href = url.toString()
  }

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

          <h1 className="font-heading text-3xl">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {mode === "signin"
              ? "Sign in to pick up where you left off."
              : "Your trial includes one schedule — no card needed."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    autoComplete="name"
                    placeholder="Ada Lovelace"
                    maxLength={120}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username{" "}
                    <span className="text-muted-foreground font-normal">
                      (your booking link)
                    </span>
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    autoComplete="username"
                    placeholder="ada"
                    maxLength={40}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" && (
                  <Link
                    href="/auth/forgot"
                    className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
                    tabIndex={-1}
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : undefined}
                maxLength={200}
              />
              {mode === "signup" && (
                <p className="text-muted-foreground text-xs">
                  At least {MIN_PASSWORD_LENGTH} characters. Length matters more
                  than symbols.
                </p>
              )}
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={40}
                />
              </div>
            )}

            {fieldErrors.length > 0 && (
              <ul
                role="alert"
                className="border-destructive/30 bg-destructive/10 text-destructive space-y-1 rounded-lg border px-3 py-2 text-sm"
              >
                {fieldErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-xs uppercase">or</span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={startGoogle}
            disabled={pending}
          >
            Continue with Google
          </Button>

          <p className="text-muted-foreground mt-8 text-center text-sm">
            {mode === "signin" ? (
              <>
                New to Laterr?{" "}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-4"
                  onClick={() => {
                    setMode("signup")
                    setFieldErrors([])
                  }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-foreground underline underline-offset-4"
                  onClick={() => {
                    setMode("signin")
                    setFieldErrors([])
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Only same-site paths are accepted as a redirect target. Taking `next`
 * straight from the query string would make this an open redirect: a crafted
 * link could bounce a freshly-signed-in user to an attacker's page.
 */
function safeDestination(next: string | undefined): string {
  if (!next) return "/app"
  if (!next.startsWith("/")) return "/app"
  if (next.startsWith("//")) return "/app"
  return next
}

function browserTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
  } catch {
    return undefined
  }
}
