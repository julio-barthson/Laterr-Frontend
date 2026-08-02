"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ExternalLink, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/errors"
import type { Booking } from "@/lib/api/schedule-types"
import { useSetMeetingUrl } from "@/lib/hooks/use-bookings"

/**
 * Mirrors the API's `@IsUrl({ require_protocol: true })` on SetMeetingUrlDto.
 *
 * `new URL()` alone is too permissive: it accepts `mailto:` and a bare host
 * like `https://meet`, both of which the API rejects. Checking the protocol and
 * requiring a dot in the hostname matches class-validator's defaults closely
 * enough that a value passing here is very unlikely to bounce off the server.
 */
function isMeetingUrl(value: string): boolean {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    return false
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return false

  return url.hostname.includes(".")
}

const schema = z.object({
  /** Empty is meaningful: it clears the link rather than failing validation. */
  meetingUrl: z
    .string()
    .trim()
    .max(1000, "That link is too long")
    .refine(
      (value) => value === "" || isMeetingUrl(value),
      "Enter a full link, including https://"
    ),
})

type FormValues = z.infer<typeof schema>

export function MeetingLinkDialog({
  open,
  booking,
  onOpenChange,
}: {
  open: boolean
  booking: Booking
  onOpenChange: (open: boolean) => void
}) {
  const setMeetingUrl = useSetMeetingUrl()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { meetingUrl: booking.meetingUrl ?? "" },
  })

  const errors = form.formState.errors
  const existing = booking.meetingUrl

  async function save(meetingUrl: string | null) {
    try {
      await setMeetingUrl.mutateAsync({ id: booking.id, meetingUrl })
      toast.success(meetingUrl ? "Meeting link updated" : "Meeting link removed")
      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.isValidation) {
          // Pin the server's complaint to the field rather than a toast the
          // user has to correlate back to the one input on screen.
          form.setError("meetingUrl", { message: error.messages.join(" · ") })
          return
        }

        toast.error(error.message)
        return
      }

      toast.error("Could not save that link")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existing ? "Edit meeting link" : "Add meeting link"}
          </DialogTitle>
          {/* The prompt this replaced gave no context at all, which is a real
              problem when the action is fired from a long list of bookings. */}
          <DialogDescription>
            {booking.inviteeName} · {booking.eventType.name}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={form.handleSubmit((values) =>
            save(values.meetingUrl || null)
          )}
          className="space-y-4"
        >
          <FieldGroup>
            <Field data-invalid={Boolean(errors.meetingUrl)}>
              <FieldLabel htmlFor="meetingUrl">Meeting link</FieldLabel>
              <Input
                id="meetingUrl"
                type="url"
                inputMode="url"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                placeholder="https://meet.google.com/abc-defg-hij"
                {...form.register("meetingUrl")}
              />
              <FieldDescription>
                Shared with {booking.inviteeName.split(" ")[0]} on their booking
                page. Leave empty to remove it.
              </FieldDescription>
              <FieldError errors={[errors.meetingUrl]} />
            </Field>
          </FieldGroup>

          {existing && (
            <a
              href={existing}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:underline hover:text-primary hover:text-foreground focus-visible:ring-ring inline-flex max-w-full items-center gap-1.5 rounded-sm text-xs focus-visible:ring-2 focus-visible:outline-none"
            >
              <span className="truncate">{existing}</span>
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          )}

          <DialogFooter>
            {existing && (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive sm:mr-auto"
                disabled={setMeetingUrl.isPending}
                onClick={() => void save(null)}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Remove
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={setMeetingUrl.isPending}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
