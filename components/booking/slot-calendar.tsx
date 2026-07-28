"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Month grid that lights up only the days with bookable slots.
 *
 * Everything here is keyed on a plain `YYYY-MM-DD` string rather than a `Date`.
 * That is deliberate: slots arrive as UTC instants and must be grouped by the
 * *invitee's* calendar day, so a grid built from local `Date` objects would
 * disagree with the grouping the moment the visitor picks a timezone other than
 * their browser's. A 23:30 London slot is already tomorrow in Tokyo.
 */
export interface YearMonth {
  year: number
  /** 0-11. */
  month: number
}

export interface SlotCalendarProps {
  /** UTC ISO instants. */
  slots: string[]
  /** IANA zone the visitor is booking in. */
  timezone: string
  visible: YearMonth
  onVisibleChange: (visible: YearMonth) => void
  /** YYYY-MM-DD. */
  selectedDay: string | null
  onSelectDay: (day: string) => void
  isLoading?: boolean
}

const WEEKDAY_INITIALS = ["S", "M", "T", "W", "T", "F", "S"] as const

/** YYYY-MM-DD for an instant, as seen from `timezone`. */
export function dayKeyInZone(instant: Date, timezone: string): string {
  // en-CA formats as YYYY-MM-DD, which is exactly the key format.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant)
}

export function groupSlotsByDay(
  slots: string[],
  timezone: string
): Map<string, string[]> {
  const grouped = new Map<string, string[]>()

  for (const slot of slots) {
    const key = dayKeyInZone(new Date(slot), timezone)
    const list = grouped.get(key) ?? []
    list.push(slot)
    grouped.set(key, list)
  }

  return grouped
}

function dayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

export function SlotCalendar({
  slots,
  timezone,
  visible,
  onVisibleChange,
  selectedDay,
  onSelectDay,
  isLoading,
}: SlotCalendarProps) {
  const byDay = React.useMemo(
    () => groupSlotsByDay(slots, timezone),
    [slots, timezone]
  )

  // "Today" in the invitee's zone, not the browser's — the two differ for a
  // visitor booking in someone else's timezone near midnight.
  const [todayKey] = React.useState(() => dayKeyInZone(new Date(), timezone))

  const { year, month } = visible

  // Date.UTC is used purely as calendar arithmetic. Because both the weekday
  // and the day count are read back with UTC getters, no local offset leaks in.
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()

  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)))

  function shift(by: number) {
    const next = new Date(Date.UTC(year, month + by, 1))
    onVisibleChange({
      year: next.getUTCFullYear(),
      month: next.getUTCMonth(),
    })
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Previous month"
          onClick={() => shift(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="font-heading text-lg" aria-live="polite">
          {monthLabel}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Next month"
          onClick={() => shift(1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        className="text-muted-foreground mb-1 grid grid-cols-7 gap-1 text-center text-xs"
        aria-hidden
      >
        {WEEKDAY_INITIALS.map((initial, index) => (
          <span key={index}>{initial}</span>
        ))}
      </div>

      <div
        className="grid grid-cols-7 gap-1"
        role="group"
        aria-label={`Available days in ${monthLabel}`}
      >
        {Array.from({ length: firstWeekday }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}

        {Array.from({ length: daysInMonth }, (_, index) => {
          const day = index + 1
          const key = dayKey(year, month, day)
          const count = byDay.get(key)?.length ?? 0
          const available = count > 0
          // Lexicographic comparison is valid for zero-padded ISO dates.
          const isPast = key < todayKey
          const isSelected = selectedDay === key

          const readable = new Intl.DateTimeFormat(undefined, {
            weekday: "long",
            day: "numeric",
            month: "long",
            timeZone: "UTC",
          }).format(new Date(Date.UTC(year, month, day)))

          return (
            <button
              key={key}
              type="button"
              disabled={!available || isPast || isLoading}
              aria-pressed={isSelected}
              aria-label={
                available
                  ? `${readable} — ${count} ${count === 1 ? "time" : "times"} available`
                  : `${readable} — unavailable`
              }
              onClick={() => onSelectDay(key)}
              className={cn(
                "grid aspect-square place-items-center rounded-lg text-sm transition-colors",
                available && !isPast
                  ? "bg-primary/10 text-foreground hover:bg-primary/20 font-medium"
                  : "text-muted-foreground/50",
                isSelected &&
                  "bg-primary text-primary-foreground hover:bg-primary",
                (!available || isPast) && "cursor-not-allowed"
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** UTC window covering a whole month, for the slots query. */
export function monthWindow(visible: YearMonth): { from: string; to: string } {
  // Padded a day either side so slots that land in an adjacent UTC day still
  // appear under the right local date for far-east and far-west timezones.
  const from = new Date(Date.UTC(visible.year, visible.month, 1))
  from.setUTCDate(from.getUTCDate() - 1)

  const to = new Date(Date.UTC(visible.year, visible.month + 1, 1))
  to.setUTCDate(to.getUTCDate() + 1)

  return { from: from.toISOString(), to: to.toISOString() }
}

export function currentYearMonth(timezone: string): YearMonth {
  const key = dayKeyInZone(new Date(), timezone)
  const [year, month] = key.split("-").map(Number)

  return { year, month: month - 1 }
}
