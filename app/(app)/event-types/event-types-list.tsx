"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Copy, Link2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ApiError } from "@/lib/api/errors"
import { LOCATION_LABELS, type EventType } from "@/lib/api/schedule-types"
import { useSession } from "@/lib/auth/use-session"
import {
  useDeleteEventType,
  useEventTypes,
  useSetEventTypeActive,
} from "@/lib/hooks/use-event-types"
import { api } from "@/lib/api/client"
import { useQuery } from "@tanstack/react-query"
import type { Profile } from "@/lib/api/domain-types"
import { PageHeader } from "@/components/PageHeader"

export function EventTypesList() {
  const { data: eventTypes, isLoading } = useEventTypes()
  const { user } = useSession()

  // The booking URL needs the username, which lives on the profile rather than
  // in the session token.
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile>("/profiles/me"),
    enabled: Boolean(user),
  })

  return (
    <>
      <div className="flex w-full flex-col items-start justify-between gap-2 lg:flex-row lg:items-center">
        <PageHeader
          back
          title={"Events"}
          description={
            "Reusable meeting templates. Each one gets its own booking link."
          }
        />
        <Button asChild className="rounded-full">
          <Link href="/event-types/new">
            <Plus className="mr-1.5 h-4 w-4" /> New event type
          </Link>
        </Button>
      </div>

      {!profile?.username && (
        <Card className="mt-6 border-primary/30 bg-primary/5">
          <CardContent>
            <CardTitle>Pick a username first</CardTitle>
            <CardDescription className="mt-1 text-sm text-muted-foreground">
              Booking links are built from your username, so your events
              aren&apos;t reachable until you set one.
            </CardDescription>
            <Button asChild variant="outline" className="mt-3">
              <Link href="/settings">Open settings</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 space-y-3">
        {isLoading &&
          Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}

        {!isLoading && (eventTypes ?? []).length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              <CardTitle>No event types yet</CardTitle>
              <CardDescription className="mx-auto mt-1 max-w-sm text-muted-foreground">
                Create one and share the link — invitees pick a time from your
                availability without emailing back and forth.
              </CardDescription>
              <Button asChild className="mt-4">
                <Link href="/event-types/new">
                  Create your first event type
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {(eventTypes ?? []).map((eventType) => (
          <EventTypeRow
            key={eventType.id}
            eventType={eventType}
            username={profile?.username ?? null}
          />
        ))}
      </div>
    </>
  )
}

function EventTypeRow({
  eventType,
  username,
}: {
  eventType: EventType
  username: string | null
}) {
  const setActive = useSetEventTypeActive()
  const remove = useDeleteEventType()

  const bookingPath = username ? `/book/${username}/${eventType.slug}` : null

  return (
    <Card>
      <CardContent className="flex flex-wrap items-start gap-4">
        <span
          aria-hidden
          className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: eventType.color }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>

            <Link
              href={`/event-types/${eventType.id}`}
              className="truncate hover:underline"
            >
              {eventType.name}
            </Link>
            </CardTitle>
            {!eventType.isActive && <Badge variant="secondary">Off</Badge>}
            {eventType.isHidden && <Badge variant="outline">Hidden</Badge>}
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            {eventType.durationMinutes} min ·{" "}
            {LOCATION_LABELS[eventType.locationType]}
            {eventType.capacity > 1 ? ` · up to ${eventType.capacity}` : ""}
          </p>

          {bookingPath && (
            <CopyLinkButton path={bookingPath} disabled={!eventType.isActive} />
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={eventType.isActive}
            aria-label={
              eventType.isActive
                ? `Turn off ${eventType.name}`
                : `Turn on ${eventType.name}`
            }
            disabled={setActive.isPending}
            onCheckedChange={(isActive) =>
              setActive.mutate(
                { id: eventType.id, isActive },
                {
                  onError: (error) =>
                    toast.error(
                      error instanceof ApiError
                        ? error.message
                        : "Could not update that event type"
                    ),
                }
              )
            }
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${eventType.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {eventType.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  Its booking link stops working immediately, and every booking
                  made through it is deleted too. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    remove.mutate(eventType.id, {
                      onSuccess: () => toast.success("Event type deleted"),
                      onError: () => toast.error("Could not delete that"),
                    })
                  }
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

function CopyLinkButton({
  path,
  disabled,
}: {
  path: string
  disabled: boolean
}) {
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    // window is only read inside the handler, so this stays render-pure.
    const absolute = `${window.location.origin}${path}`

    try {
      await navigator.clipboard.writeText(absolute)
      setCopied(true)
      toast.success("Booking link copied")
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access needs a secure context and can be blocked outright.
      toast.error("Could not copy — the link is shown below")
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <code className="truncate rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
        {path}
      </code>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={copy}
        disabled={disabled}
      >
        {copied ? (
          <Check className="mr-1 h-3.5 w-3.5" />
        ) : (
          <Copy className="mr-1 h-3.5 w-3.5" />
        )}
        Copy link
      </Button>
      {/* `disabled` cannot ride on `asChild`: Slot merges it onto the anchor,
          where it has no effect — the control would look enabled and still open
          a page that does not exist yet (no username set). */}
      {disabled ? (
        <Button variant="ghost" size="sm" disabled>
          <Link2 className="mr-1 h-3.5 w-3.5" /> Preview
        </Button>
      ) : (
        <Button asChild variant="ghost" size="sm">
          <Link href={path} target="_blank" rel="noopener noreferrer">
            <Link2 className="mr-1 h-3.5 w-3.5" /> Preview
          </Link>
        </Button>
      )}
    </div>
  )
}
