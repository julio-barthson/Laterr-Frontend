"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

/**
 * Hands the message to the visitor's mail client.
 *
 * The original simulated a send — 600ms, reset the form, toasted "we'll be in
 * touch" — with no endpoint behind it, so nothing ever arrived. Rather than
 * reproduce a form that lies, this composes a real message the visitor can see
 * leave. It needs no backend; swap `onSubmit` for a POST if a contact endpoint
 * is ever added.
 */
export function ContactForm({ to }: { to: string }) {
  const [sending, setSending] = React.useState(false)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    const name = String(form.get("name") ?? "").trim()
    const email = String(form.get("email") ?? "").trim()
    const message = String(form.get("message") ?? "").trim()

    if (!name || !email || !message) return

    setSending(true)

    const subject = `Hello from ${name}`
    const body = `${message}\n\n—\n${name}\n${email}`

    window.location.href = `mailto:${to}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`

    // The navigation hands off to a mail client rather than unloading the page,
    // so the button has to be released explicitly.
    window.setTimeout(() => {
      setSending(false)
      toast.success("Your mail app should be opening now.")
    }, 800)
  }

  return (
    <form
      onSubmit={onSubmit}
      className="border-border/60 bg-card rounded-3xl border p-6 md:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="name">Your name</FieldLabel>
          <Input id="name" name="name" required maxLength={120} />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={200}
          />
        </Field>
      </div>

      <Field className="mt-4">
        <FieldLabel htmlFor="message">Message</FieldLabel>
        <Textarea id="message" name="message" required rows={5} maxLength={2000} />
      </Field>

      <Button
        type="submit"
        size="lg"
        className="mt-5 h-11 rounded-full px-6"
        disabled={sending}
      >
        {sending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
        {sending ? "Sending…" : "Send message"}
      </Button>
    </form>
  )
}
