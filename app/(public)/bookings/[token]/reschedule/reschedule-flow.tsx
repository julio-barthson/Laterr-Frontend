"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  SlotCalendar,
  currentYearMonth,
  groupSlotsByDay,
  monthWindow,
  type YearMonth,
} from "@/components/booking/slot-calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api/errors"
import {
  usePublicSlots,
  useRescheduleBooking,
  useTokenBooking,
} from "@/lib/hooks/use-public-booking"

export function RescheduleFlow({ token }: { token: string }) {
  const { data: booking, isLoading, isError } = useTokenBooking(token)

  if (isLoading) {
    return <Skeleton className="mx-auto h-96 max-w-3xl rounded-xl" />
  }

  if (isError || !booking) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="py-10 text-center">
          <h1 className="font-heading text-xl">Booking not found</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            This link may have expired.
          </p>
        </CardContent>
      </Card>
    )
  }

  const username = booking.host.profile?.username ?? null
  const slug = booking.eventType.slug

  if (booking.status === "cancelled") {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="py-10 text-center">
          <h1 className="font-heading text-xl">
            This booking was cancelled
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Cancelled bookings can&apos;t be rescheduled — book a new time
            instead.
          </p>
          {username && (
            <Button asChild className="mt-4 rounded-full">
              <Link href={`/book/${username}`}>Book another time</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Without a host username there is no public slots endpoint to query.
  if (!username) {
    return (
      <Card className="mx-auto max-w-md">
        <CardContent className="py-10 text-center">
          <h1 className="font-heading text-xl">Can&apos;t reschedule online</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Your host&apos;s public page isn&apos;t available. Contact them
            directly to move this booking.
          </p>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/bookings/${token}`}>Back to booking</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <SlotPicker
      // Keyed on the booking so the month/day state is seeded once from the
      // invitee's timezone, rather than via setState during render.
      key={booking.id}
      token={token}
      username={username}
      slug={slug}
      timezone={booking.inviteeTimezone}
      eventName={booking.eventType.name}
      currentStartsAt={booking.startsAt}
    />
  )
}

function SlotPicker({
  token,
  username,
  slug,
  timezone,
  eventName,
  currentStartsAt,
}: {
  token: string
  username: string
  slug: string
  timezone: string
  eventName: string
  currentStartsAt: string
}) {
  const router = useRouter()
  const reschedule = useRescheduleBooking(token)

  const [visible, setVisible] = React.useState<YearMonth>(() =>
    currentYearMonth(timezone)
  )
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null)
  const [reason, setReason] = React.useState("")

  const slots = usePublicSlots(username, slug, monthWindow(visible))

  const byDay = groupSlotsByDay(slots.data?.slots ?? [], timezone)
  const daySlots = selectedDay ? (byDay.get(selectedDay) ?? []) : []

  async function move(startsAt: string) {
    try {
      await reschedule.mutateAsync({
        startsAt,
        reason: reason.trim() || undefined,
      })

      toast.success("Booking moved")
      router.push(`/bookings/${token}`)
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          toast.error(error.message)
          void slots.refetch()
          setSelectedDay(null)
          return
        }

        toast.error(error.message)
        return
      }

      toast.error("Could not move that booking")
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/bookings/${token}`}>
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Back to booking
        </Link>
      </Button>

      <header className="mb-4">
        <h1 className="font-heading text-2xl sm:text-3xl">Pick a new time</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {eventName} · currently{" "}
          {new Intl.DateTimeFormat(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "numeric",
            minute: "2-digit",
            timeZone: timezone,
          }).format(new Date(currentStartsAt))}
        </p>
      </header>

      <Card>
        <CardContent className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_220px]">
          <SlotCalendar
              slots={slots.data?.slots ?? []}
              timezone={timezone}
              visible={visible}
              onVisibleChange={(next) => {
                setVisible(next)
                setSelectedDay(null)
              }}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            isLoading={slots.isLoading}
          />

          <div className="space-y-3">
            <Input
              aria-label="Reason for rescheduling (optional)"
              placeholder="Reason (optional)"
              value={reason}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
            />

            {slots.isLoading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }, (_, index) => (
                  <Skeleton key={index} className="h-9 rounded-lg" />
                ))}
              </div>
            )}

            {!slots.isLoading && !selectedDay && (
              <p className="text-muted-foreground text-sm">
                Select a highlighted day.
              </p>
            )}

            {!slots.isLoading && selectedDay && daySlots.length === 0 && (
              <p className="text-muted-foreground text-sm">
                No times left on this day.
              </p>
            )}

            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {daySlots.map((slot) => (
                <Button
                  key={slot}
                  type="button"
                  variant="outline"
                  className="w-full justify-center"
                  disabled={reschedule.isPending}
                  onClick={() => void move(slot)}
                >
                  {reschedule.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {new Intl.DateTimeFormat(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: timezone,
                  }).format(new Date(slot))}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
