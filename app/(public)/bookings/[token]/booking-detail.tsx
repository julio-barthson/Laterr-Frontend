"use client"

import * as React from "react"
import Link from "next/link"
import {
  CalendarClock,
  CalendarPlus,
  Clock,
  Download,
  Globe,
  Loader2,
  MapPin,
  XCircle,
} from "lucide-react"
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
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { API_BASE_URL } from "@/lib/api/config"
import { LOCATION_LABELS } from "@/lib/api/schedule-types"
import { useCancelBooking, useTokenBooking } from "@/lib/hooks/use-public-booking"
import { formatDuration } from "@/lib/time"

export function BookingDetail({ token }: { token: string }) {
  const { data: booking, isLoading, isError } = useTokenBooking(token)
  const cancel = useCancelBooking(token)
  const [reason, setReason] = React.useState("")

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-4">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    )
  }

  // A bad or expired token is indistinguishable from a deleted booking, and
  // should stay that way — confirming which would leak whether the token was
  // ever valid.
  if (isError || !booking) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="py-10 text-center">
          <h1 className="font-heading text-xl">Booking not found</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            This link may have expired, or the booking was removed. Check the
            confirmation you were sent.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/">Go to Laterr</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isCancelled = booking.status === "cancelled"
  const timezone = booking.inviteeTimezone
  const hostName =
    booking.host.profile?.displayName ??
    (booking.host.profile?.username
      ? `@${booking.host.profile.username}`
      : "your host")

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-muted-foreground text-sm">
                with {hostName}
              </p>
              <h1 className="font-heading text-2xl">
                {booking.eventType.name}
              </h1>
            </div>
            <Badge variant={isCancelled ? "outline" : "default"}>
              {booking.status.replace("_", " ")}
            </Badge>
          </div>

          {booking.eventType.description && (
            <p className="text-muted-foreground text-sm">
              {booking.eventType.description}
            </p>
          )}

          <dl className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <CalendarClock className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <dd className={isCancelled ? "line-through" : "font-medium"}>
                {formatInZone(booking.startsAt, timezone)}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4 shrink-0" />
              <dd>{formatDuration(booking.eventType.durationMinutes)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
              <dd>
                {LOCATION_LABELS[booking.locationType]}
                {booking.locationDetails ? ` · ${booking.locationDetails}` : ""}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="text-muted-foreground h-4 w-4 shrink-0" />
              <dd className="text-muted-foreground text-xs">{timezone}</dd>
            </div>
          </dl>

          {booking.meetingUrl && !isCancelled && (
            <Button asChild className="w-full rounded-full">
              <a href={booking.meetingUrl} target="_blank" rel="noreferrer">
                Join the meeting
              </a>
            </Button>
          )}

          {booking.rescheduledAt && (
            <p className="text-muted-foreground text-xs">
              Rescheduled on {formatInZone(booking.rescheduledAt, timezone)}.
            </p>
          )}

          {isCancelled && (
            <div className="border-border rounded-xl border p-3">
              <p className="text-sm font-medium">This booking was cancelled</p>
              {booking.cancelReason && (
                <p className="text-muted-foreground mt-1 text-sm">
                  {booking.cancelReason}
                </p>
              )}
              {booking.host.profile?.username && (
                <Button asChild variant="outline" className="mt-3">
                  <Link href={`/book/${booking.host.profile.username}`}>
                    Book another time
                  </Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {!isCancelled && (
        <Card>
          <CardContent className="space-y-3">
            <p className="font-heading text-lg">Add to your calendar</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a
                  href={booking.addToCalendar.google}
                  target="_blank"
                  rel="noreferrer"
                >
                  <CalendarPlus className="mr-1.5 h-4 w-4" /> Google
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <a
                  href={booking.addToCalendar.outlook}
                  target="_blank"
                  rel="noreferrer"
                >
                  <CalendarPlus className="mr-1.5 h-4 w-4" /> Outlook
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                {/* A plain link, not fetch: the API serves this as a
                    text/calendar attachment and the browser handles it. */}
                <a href={`${API_BASE_URL}/public/bookings/${token}/ics`}>
                  <Download className="mr-1.5 h-4 w-4" /> Apple / .ics
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isCancelled && (
        <Card>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-full">
              <Link href={`/bookings/${token}/reschedule`}>
                <CalendarClock className="mr-1.5 h-4 w-4" /> Reschedule
              </Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" className="rounded-full">
                  <XCircle className="mr-1.5 h-4 w-4" /> Cancel booking
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {hostName} will see that you cancelled. You can book another
                    time afterwards.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <Input
                  aria-label="Reason (optional)"
                  placeholder="Reason (optional)"
                  value={reason}
                  maxLength={500}
                  onChange={(event) => setReason(event.target.value)}
                />

                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      cancel.mutate(reason.trim() || undefined, {
                        onSuccess: () => toast.success("Booking cancelled"),
                        onError: () =>
                          toast.error("Could not cancel that booking"),
                      })
                    }
                  >
                    {cancel.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Cancel booking
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function formatInZone(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(iso))
}
