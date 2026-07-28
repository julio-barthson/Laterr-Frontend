"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

/**
 * Jump straight to a host's booking page.
 *
 * Navigates rather than looking the username up first: /book/[username] already
 * renders a clear "no such page" state, so a pre-flight request would only add
 * a round trip and a second way to be wrong.
 */
export function ScheduleNow() {
  const router = useRouter()
  const [username, setUsername] = React.useState("")

  const cleaned = username.trim().toLowerCase().replace(/^@/, "")

  function go(event: React.FormEvent) {
    event.preventDefault()
    if (!cleaned) return

    router.push(`/book/${encodeURIComponent(cleaned)}`)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 sm:py-24">
      <h1 className="font-heading text-4xl md:text-5xl">Schedule now</h1>
      <p className="text-muted-foreground mt-4">
        Know someone&apos;s Laterr username? Go straight to their booking page.
      </p>

      <Card className="mt-8">
        <CardContent>
          <form onSubmit={go} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="username">Username</FieldLabel>
              <Input
                id="username"
                placeholder="ada"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={40}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
              <FieldDescription>
                {cleaned ? `Opens /book/${cleaned}` : "The @ is optional."}
              </FieldDescription>
            </Field>

            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={!cleaned}
            >
              Open booking page <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-muted-foreground mt-6 text-sm">
        Want your own link?{" "}
        <Link href="/auth" className="text-foreground underline">
          Create an account
        </Link>{" "}
        and pick a username.
      </p>
    </div>
  )
}
