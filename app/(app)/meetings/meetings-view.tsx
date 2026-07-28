"use client"

import * as React from "react"
import { Download, Loader2, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NativeSelect } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { BookingStatus } from "@/lib/api/domain-types"
import {
  LOCATION_LABELS,
  type Booking,
  type MeetingsTab,
} from "@/lib/api/schedule-types"
import {
  downloadBookingsCsv,
  useBookings,
  useSetBookingStatus,
  useSetMeetingUrl,
} from "@/lib/hooks/use-bookings"
import { useEventTypes } from "@/lib/hooks/use-event-types"

const TABS: Array<{ value: MeetingsTab; label: string }> = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
]

const STATUS_VARIANT: Partial<
  Record<BookingStatus, "default" | "secondary" | "outline" | "destructive">
> = {
  confirmed: "default",
  rescheduled: "secondary",
  completed: "secondary",
  no_show: "destructive",
  cancelled: "outline",
}

export function MeetingsView() {
  const [tab, setTab] = React.useState<MeetingsTab>("upcoming")
  const [eventTypeId, setEventTypeId] = React.useState<string>("all")
  const [exporting, setExporting] = React.useState(false)

  const filter = {
    tab,
    eventTypeId: eventTypeId === "all" ? undefined : eventTypeId,
  }

  const { data: bookings, isLoading } = useBookings(filter)
  const { data: eventTypes } = useEventTypes()

  async function exportCsv() {
    setExporting(true)

    try {
      await downloadBookingsCsv(filter)
    } catch {
      toast.error("Could not export those bookings")
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl">Meetings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Everything booked through your event links.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={exporting || (bookings ?? []).length === 0}
        >
          {exporting ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-4 w-4" />
          )}
          Export CSV
        </Button>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={(value) => setTab(value as MeetingsTab)}>
          <TabsList>
            {TABS.map((entry) => (
              <TabsTrigger key={entry.value} value={entry.value}>
                {entry.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <NativeSelect
          aria-label="Filter by event type"
          className="w-52"
          value={eventTypeId}
          onChange={(event) => setEventTypeId(event.target.value)}
        >
          <option value="all">All event types</option>
          {(eventTypes ?? []).map((eventType) => (
            <option key={eventType.id} value={eventType.id}>
              {eventType.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading &&
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}

        {!isLoading && (bookings ?? []).length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="font-heading text-lg">No meetings here</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {tab === "upcoming"
                  ? "Nothing booked yet. Share an event link to start taking bookings."
                  : "Nothing matches this filter."}
              </p>
            </CardContent>
          </Card>
        )}

        {(bookings ?? []).map((booking) => (
          <BookingRow key={booking.id} booking={booking} />
        ))}
      </div>
    </>
  )
}

function BookingRow({ booking }: { booking: Booking }) {
  const setStatus = useSetBookingStatus()
  const setMeetingUrl = useSetMeetingUrl()

  const start = new Date(booking.startsAt)
  const end = new Date(booking.endsAt)

  function promptForMeetingUrl() {
    // A prompt is deliberately crude but honest: an inline editor here would be
    // a bigger surface than the action deserves.
    const next = window.prompt("Meeting link", booking.meetingUrl ?? "https://")

    if (next === null) return

    setMeetingUrl.mutate(
      { id: booking.id, meetingUrl: next.trim() || null },
      {
        onSuccess: () => toast.success("Meeting link updated"),
        onError: () => toast.error("Could not save that link"),
      }
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-start gap-4">
        <span
          aria-hidden
          className="mt-1 h-10 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: booking.eventType.color }}
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading truncate text-lg">
              {booking.inviteeName}
            </p>
            <Badge variant={STATUS_VARIANT[booking.status] ?? "secondary"}>
              {booking.status.replace("_", " ")}
            </Badge>
          </div>

          <p className="text-muted-foreground mt-1 text-sm">
            {booking.eventType.name} ·{" "}
            <time dateTime={booking.startsAt}>
              {start.toLocaleString()}
            </time>
            {" – "}
            {end.toLocaleTimeString(undefined, {
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>

          <p className="text-muted-foreground mt-0.5 text-xs">
            {booking.inviteeEmail} · {booking.inviteeTimezone} ·{" "}
            {LOCATION_LABELS[booking.locationType]}
          </p>

          {booking.answers.length > 0 && (
            <dl className="mt-2 space-y-1">
              {booking.answers.map((answer) => (
                <div key={answer.id} className="text-xs">
                  <dt className="text-muted-foreground inline">
                    {answer.question.label}:{" "}
                  </dt>
                  <dd className="inline">{answer.answer ?? "—"}</dd>
                </div>
              ))}
            </dl>
          )}

          {booking.cancelReason && (
            <p className="text-muted-foreground mt-2 text-xs italic">
              Cancelled: {booking.cancelReason}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Actions for ${booking.inviteeName}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={promptForMeetingUrl}>
              {booking.meetingUrl ? "Change meeting link" : "Add meeting link"}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                void navigator.clipboard
                  .writeText(booking.inviteeEmail)
                  .then(() => toast.success("Email copied"))
                  .catch(() => toast.error("Could not copy"))
              }
            >
              Copy invitee email
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {booking.status !== "completed" && (
              <DropdownMenuItem
                onClick={() =>
                  setStatus.mutate({ id: booking.id, status: "completed" })
                }
              >
                Mark completed
              </DropdownMenuItem>
            )}

            {booking.status !== "no_show" && (
              <DropdownMenuItem
                onClick={() =>
                  setStatus.mutate({ id: booking.id, status: "no_show" })
                }
              >
                Mark no-show
              </DropdownMenuItem>
            )}

            {booking.status !== "cancelled" && (
              <DropdownMenuItem
                variant="destructive"
                onClick={() =>
                  setStatus.mutate(
                    { id: booking.id, status: "cancelled" },
                    {
                      onSuccess: () => toast.success("Booking cancelled"),
                      onError: () => toast.error("Could not cancel that"),
                    }
                  )
                }
              >
                Cancel booking
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  )
}
