"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { ArrowLeft, CalendarCheck, Clock, Globe, Loader2, MapPin } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import {
  SlotCalendar,
  currentYearMonth,
  groupSlotsByDay,
  monthWindow,
  type YearMonth,
} from "./slot-calendar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api/errors"
import type { PublicQuestion } from "@/lib/api/public-types"
import { LOCATION_LABELS } from "@/lib/api/schedule-types"
import {
  useCreateBooking,
  usePublicEventType,
  usePublicSlots,
} from "@/lib/hooks/use-public-booking"
import { browserTimezone, formatDuration, timezoneOptions } from "@/lib/time"

const detailsSchema = z.object({
  inviteeName: z.string().trim().min(1, "Your name is required").max(120),
  inviteeEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(200),
  notes: z.string().max(2000).optional(),
  /** Keyed by question id. Validated against isRequired on submit. */
  answers: z.record(z.string(), z.string().max(2000)).optional(),
})

type DetailsValues = z.infer<typeof detailsSchema>

export function BookingFlow({
  username,
  slug,
}: {
  username: string
  slug: string
}) {
  const [timezone, setTimezone] = React.useState(() => browserTimezone())
  const [visible, setVisible] = React.useState<YearMonth>(() =>
    currentYearMonth(browserTimezone())
  )
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null)
  const [confirmed, setConfirmed] = React.useState<{
    startsAt: string
    token: string
  } | null>(null)

  const event = usePublicEventType(username, slug)
  const slots = usePublicSlots(username, slug, monthWindow(visible))

  if (event.isLoading) {
    return <BookingSkeleton />
  }

  if (event.isError || !event.data) {
    return <NotBookable />
  }

  const { host, eventType, questions } = event.data

  if (confirmed) {
    return (
      <Confirmation
        startsAt={confirmed.startsAt}
        token={confirmed.token}
        timezone={timezone}
        eventName={eventType.name}
      />
    )
  }

  const byDay = groupSlotsByDay(slots.data?.slots ?? [], timezone)
  const daySlots = selectedDay ? (byDay.get(selectedDay) ?? []) : []

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Left: who and what */}
      <Card className="h-fit">
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11">
              {host.avatarUrl && (
                <AvatarImage src={host.avatarUrl} alt="" />
              )}
              <AvatarFallback>
                {initials(host.displayName ?? host.username ?? "?")}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-muted-foreground truncate text-sm">
                {host.displayName ?? host.username}
              </p>
              <h1 className="font-heading truncate text-xl">
                {eventType.name}
              </h1>
            </div>
          </div>

          {eventType.description && (
            <p className="text-muted-foreground text-sm">
              {eventType.description}
            </p>
          )}

          <dl className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4 shrink-0" />
              <dd>{formatDuration(eventType.durationMinutes)}</dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="text-muted-foreground h-4 w-4 shrink-0" />
              <dd>
                {LOCATION_LABELS[eventType.locationType]}
                {eventType.locationDetails
                  ? ` · ${eventType.locationDetails}`
                  : ""}
              </dd>
            </div>
            {selectedSlot && (
              <div className="flex items-center gap-2">
                <CalendarCheck className="text-primary h-4 w-4 shrink-0" />
                <dd className="font-medium">
                  {formatSlot(selectedSlot, timezone, "full")}
                </dd>
              </div>
            )}
          </dl>

          <Field>
            <FieldLabel htmlFor="timezone" className="text-xs">
              <Globe className="mr-1 inline h-3.5 w-3.5" /> Timezone
            </FieldLabel>
            <NativeSelect
              id="timezone"
              value={timezone}
              onChange={(event) => {
                setTimezone(event.target.value)
                // The visible month is derived from the zone, and a slot picked
                // in one zone would read as a different day in another.
                setSelectedDay(null)
                setSelectedSlot(null)
              }}
            >
              {!timezoneOptions().includes(timezone) && (
                <option value={timezone}>{timezone}</option>
              )}
              {timezoneOptions().map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </CardContent>
      </Card>

      {/* Right: pick a time, then give details */}
      <Card>
        <CardContent>
          {selectedSlot ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-4"
                onClick={() => setSelectedSlot(null)}
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" /> Pick another time
              </Button>

              <DetailsForm
                username={username}
                slug={slug}
                startsAt={selectedSlot}
                timezone={timezone}
                questions={questions}
                onBooked={(token) =>
                  setConfirmed({ startsAt: selectedSlot, token })
                }
                onSlotTaken={() => {
                  setSelectedSlot(null)
                  void slots.refetch()
                }}
              />
            </>
          ) : (
            <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_200px]">
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

              <div>
                <p className="font-heading mb-3 text-sm">
                  {selectedDay
                    ? formatDayHeading(selectedDay)
                    : "Select a day"}
                </p>

                {slots.isLoading && (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Skeleton key={index} className="h-9 rounded-lg" />
                    ))}
                  </div>
                )}

                {!slots.isLoading && !selectedDay && (
                  <p className="text-muted-foreground text-sm">
                    Highlighted days have times available.
                  </p>
                )}

                {!slots.isLoading && selectedDay && daySlots.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No times left on this day.
                  </p>
                )}

                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {daySlots.map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      variant="outline"
                      className="w-full justify-center"
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {formatSlot(slot, timezone, "time")}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function DetailsForm({
  username,
  slug,
  startsAt,
  timezone,
  questions,
  onBooked,
  onSlotTaken,
}: {
  username: string
  slug: string
  startsAt: string
  timezone: string
  questions: PublicQuestion[]
  onBooked: (token: string) => void
  onSlotTaken: () => void
}) {
  const create = useCreateBooking(username, slug)

  const form = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { inviteeName: "", inviteeEmail: "", notes: "", answers: {} },
  })

  const errors = form.formState.errors

  async function submit(values: DetailsValues) {
    // Required-question validation lives here rather than in the Zod schema
    // because which questions are required is server data, not a static shape.
    const missing = questions.filter(
      (question) =>
        question.isRequired && !values.answers?.[question.id]?.trim()
    )

    if (missing.length > 0) {
      toast.error(`Please answer: ${missing.map((q) => q.label).join(", ")}`)
      return
    }

    try {
      const booking = await create.mutateAsync({
        startsAt,
        inviteeName: values.inviteeName,
        inviteeEmail: values.inviteeEmail,
        inviteeTimezone: timezone,
        notes: values.notes || undefined,
        answers: questions
          .map((question) => ({
            questionId: question.id,
            answer: values.answers?.[question.id]?.trim() || undefined,
          }))
          .filter((answer) => answer.answer !== undefined),
      })

      onBooked(booking.cancelToken)
    } catch (error) {
      if (error instanceof ApiError) {
        // 409 means the slot went while the form was open — send them back to
        // the picker with fresh availability rather than leaving them stuck.
        if (error.status === 409) {
          toast.error(error.message)
          onSlotTaken()
          return
        }

        toast.error(
          error.isValidation ? error.messages.join(" · ") : error.message
        )
        return
      }

      toast.error("Could not confirm that booking")
    }
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <h2 className="font-heading text-xl">Your details</h2>

      <FieldGroup>
        <Field data-invalid={Boolean(errors.inviteeName)}>
          <FieldLabel htmlFor="inviteeName">Name</FieldLabel>
          <Input
            id="inviteeName"
            autoComplete="name"
            {...form.register("inviteeName")}
          />
          <FieldError errors={[errors.inviteeName]} />
        </Field>

        <Field data-invalid={Boolean(errors.inviteeEmail)}>
          <FieldLabel htmlFor="inviteeEmail">Email</FieldLabel>
          <Input
            id="inviteeEmail"
            type="email"
            autoComplete="email"
            {...form.register("inviteeEmail")}
          />
          <FieldError errors={[errors.inviteeEmail]} />
        </Field>

        {questions.map((question) => (
          <Field key={question.id}>
            <FieldLabel htmlFor={`q-${question.id}`}>
              {question.label}
              {question.isRequired && (
                <span className="text-destructive ml-0.5">*</span>
              )}
            </FieldLabel>

            {question.qtype === "textarea" ? (
              <Textarea
                id={`q-${question.id}`}
                rows={3}
                {...form.register(`answers.${question.id}`)}
              />
            ) : question.qtype === "select" ? (
              <NativeSelect
                id={`q-${question.id}`}
                {...form.register(`answers.${question.id}`)}
              >
                <option value="">Choose…</option>
                {(question.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </NativeSelect>
            ) : question.qtype === "checkbox" ? (
              <Field orientation="horizontal">
                <Checkbox
                  id={`q-${question.id}`}
                  onCheckedChange={(checked) =>
                    form.setValue(
                      `answers.${question.id}`,
                      checked === true ? "Yes" : ""
                    )
                  }
                />
                <FieldLabel
                  htmlFor={`q-${question.id}`}
                  className="font-normal"
                >
                  Yes
                </FieldLabel>
              </Field>
            ) : (
              <Input
                id={`q-${question.id}`}
                type={question.qtype === "phone" ? "tel" : "text"}
                {...form.register(`answers.${question.id}`)}
              />
            )}
          </Field>
        ))}

        <Field>
          <FieldLabel htmlFor="notes">
            Anything else?{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </FieldLabel>
          <Textarea id="notes" rows={3} {...form.register("notes")} />
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        className="w-full rounded-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Confirm booking
      </Button>
    </form>
  )
}

function Confirmation({
  startsAt,
  token,
  timezone,
  eventName,
}: {
  startsAt: string
  token: string
  timezone: string
  eventName: string
}) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="space-y-4 text-center">
        <span className="bg-primary/10 text-primary mx-auto grid h-12 w-12 place-items-center rounded-full">
          <CalendarCheck className="h-6 w-6" />
        </span>

        <div>
          <h1 className="font-heading text-2xl">You&apos;re booked</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {eventName} · {formatSlot(startsAt, timezone, "full")}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">{timezone}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild className="rounded-full">
            <a href={`/bookings/${token}`}>View or change this booking</a>
          </Button>
          <p className="text-muted-foreground text-xs">
            Keep that link — it&apos;s how you reschedule or cancel.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function BookingSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Skeleton className="h-72 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}

function NotBookable() {
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="py-10 text-center">
        <h1 className="font-heading text-xl">This link isn&apos;t available</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          The event may have been turned off or removed. Try asking the host for
          a new link.
        </p>
      </CardContent>
    </Card>
  )
}

function formatSlot(
  iso: string,
  timezone: string,
  style: "time" | "full"
): string {
  const options: Intl.DateTimeFormatOptions =
    style === "time"
      ? { hour: "numeric", minute: "2-digit", timeZone: timezone }
      : {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "numeric",
          minute: "2-digit",
          timeZone: timezone,
        }

  return new Intl.DateTimeFormat(undefined, options).format(new Date(iso))
}

/** `day` is YYYY-MM-DD, so render it in UTC to avoid an off-by-one. */
function formatDayHeading(day: string): string {
  const [year, month, date] = day.split("-").map(Number)

  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, date)))
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}
