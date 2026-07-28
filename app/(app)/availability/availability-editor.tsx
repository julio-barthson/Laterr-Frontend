"use client"

import * as React from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { ApiError } from "@/lib/api/errors"
import {
  useAvailability,
  useDeleteDateOverride,
  useSaveAvailability,
  useUpsertDateOverride,
} from "@/lib/hooks/use-availability"
import {
  WEEKDAY_LABELS,
  formatDateOnly,
  isoDateOnly,
  minutesToTime,
  timeToMinutes,
  timezoneOptions,
} from "@/lib/time"

/** One editable window. Times are strings so a half-typed value is allowed. */
interface DraftWindow {
  key: string
  start: string
  end: string
}

type Draft = Record<number, DraftWindow[]>

let windowKeySeq = 0
const nextKey = () => `w${(windowKeySeq += 1)}`

export function AvailabilityEditor() {
  const { data, isLoading } = useAvailability()

  return (
    <>
      {/* Outside the loading gate on purpose: the page title and description
          are static, so hiding them behind the fetch would leave the first
          paint as unlabelled skeletons. */}
      <header>
        <h1 className="font-heading text-3xl sm:text-4xl">Availability</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          When invitees can book you. Times are in your schedule&apos;s
          timezone.
        </p>
      </header>

      {isLoading || !data ? (
        <div className="mt-6 space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      ) : (
        <>
          {/*
            Keyed on the schedule id so React remounts — and therefore re-seeds
            the editable draft — only when a genuinely different schedule
            arrives. This avoids both setState-during-render and an effect that
            would clobber unsaved edits on every background refetch.
          */}
          <WeeklyHoursEditor
            key={data.schedule.id}
            initialTimezone={data.schedule.timezone}
            initialRules={data.rules}
          />
          <DateOverrides overrides={data.overrides} />
        </>
      )}
    </>
  )
}

function WeeklyHoursEditor({
  initialTimezone,
  initialRules,
}: {
  initialTimezone: string
  initialRules: Array<{ weekday: number; startMin: number; endMin: number }>
}) {
  const save = useSaveAvailability()

  const [timezone, setTimezone] = React.useState(initialTimezone)
  const [draft, setDraft] = React.useState<Draft>(() => toDraft(initialRules))

  function updateWindow(
    weekday: number,
    key: string,
    patch: Partial<DraftWindow>
  ) {
    setDraft((current) => ({
      ...current,
      [weekday]: current[weekday].map((window) =>
        window.key === key ? { ...window, ...patch } : window
      ),
    }))
  }

  function addWindow(weekday: number) {
    setDraft((current) => {
      const existing = current[weekday] ?? []
      // Start the new window after the last one so the common case needs no
      // editing, and an overlap is not created by default.
      const lastEnd = existing.length
        ? (timeToMinutes(existing[existing.length - 1].end) ?? 17 * 60)
        : 9 * 60

      const start = Math.min(lastEnd, 23 * 60)

      return {
        ...current,
        [weekday]: [
          ...existing,
          {
            key: nextKey(),
            start: minutesToTime(start),
            end: minutesToTime(Math.min(start + 60, 1440)),
          },
        ],
      }
    })
  }

  function removeWindow(weekday: number, key: string) {
    setDraft((current) => ({
      ...current,
      [weekday]: current[weekday].filter((window) => window.key !== key),
    }))
  }

  function copyMondayToWeekdays() {
    setDraft((current) => {
      const monday = current[1] ?? []
      const next = { ...current }

      for (const weekday of [2, 3, 4, 5]) {
        next[weekday] = monday.map((window) => ({ ...window, key: nextKey() }))
      }

      return next
    })
  }

  async function submit() {
    const rules: Array<{ weekday: number; startMin: number; endMin: number }> =
      []

    for (const [weekdayKey, windows] of Object.entries(draft)) {
      const weekday = Number(weekdayKey)

      for (const window of windows) {
        const startMin = timeToMinutes(window.start)
        const endMin = timeToMinutes(window.end)

        if (startMin === null || endMin === null) {
          toast.error(`${WEEKDAY_LABELS[weekday]}: enter both times as HH:MM`)
          return
        }

        if (endMin <= startMin) {
          toast.error(`${WEEKDAY_LABELS[weekday]}: end must be after start`)
          return
        }

        rules.push({ weekday, startMin, endMin })
      }
    }

    try {
      await save.mutateAsync({ timezone, rules })
      toast.success("Availability saved")
    } catch (error) {
      // The API also rejects overlaps, which the client does not pre-check —
      // surfacing its message verbatim is more useful than a generic one.
      toast.error(
        error instanceof ApiError ? error.message : "Could not save availability"
      )
    }
  }

  const zones = timezoneOptions()

  return (
    <>
      <div className="mt-6 flex justify-end">
        <Button
          onClick={submit}
          className="rounded-full"
          disabled={save.isPending}
        >
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>

      <Card className="mt-4">
        <CardContent>
          <Field>
            <FieldLabel htmlFor="timezone">Timezone</FieldLabel>
            <NativeSelect
              id="timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
            >
              {/* A stored zone missing from the runtime's list would otherwise
                  silently reset the select to its first option. */}
              {!zones.includes(timezone) && (
                <option value={timezone}>{timezone}</option>
              )}
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </NativeSelect>
            <FieldDescription>
              Every window below is interpreted in this zone. Invitees see slots
              converted to theirs.
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-xl">Weekly hours</h2>
            <Button type="button" variant="ghost" size="sm" onClick={copyMondayToWeekdays}>
              Copy Monday to Tue–Fri
            </Button>
          </div>

          <div className="divide-border/60 divide-y">
            {WEEKDAY_LABELS.map((label, weekday) => {
              const windows = draft[weekday] ?? []

              return (
                <div
                  key={label}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start"
                >
                  <div className="flex w-full items-center gap-3 sm:w-48">
                    <Switch
                      id={`open-${weekday}`}
                      checked={windows.length > 0}
                      aria-label={`${label} availability`}
                      onCheckedChange={(open) =>
                        open
                          ? addWindow(weekday)
                          : setDraft((current) => ({
                              ...current,
                              [weekday]: [],
                            }))
                      }
                    />
                    <FieldLabel htmlFor={`open-${weekday}`}>{label}</FieldLabel>
                  </div>

                  <div className="flex-1 space-y-2">
                    {windows.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        Unavailable
                      </p>
                    ) : (
                      windows.map((window) => (
                        <div
                          key={window.key}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <Input
                            type="time"
                            aria-label={`${label} start`}
                            className="w-32"
                            value={window.start}
                            onChange={(event) =>
                              updateWindow(weekday, window.key, {
                                start: event.target.value,
                              })
                            }
                          />
                          <span className="text-muted-foreground text-sm">
                            to
                          </span>
                          <Input
                            type="time"
                            aria-label={`${label} end`}
                            className="w-32"
                            value={window.end}
                            onChange={(event) =>
                              updateWindow(weekday, window.key, {
                                end: event.target.value,
                              })
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove this ${label} window`}
                            onClick={() => removeWindow(weekday, window.key)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}

                    {windows.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addWindow(weekday)}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" /> Add window
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

    </>
  )
}

function DateOverrides({
  overrides,
}: {
  overrides: Array<{
    id: string
    theDate: string
    isClosed: boolean
    startMin: number | null
    endMin: number | null
  }>
}) {
  const upsert = useUpsertDateOverride()
  const remove = useDeleteDateOverride()

  const [date, setDate] = React.useState("")
  const [closed, setClosed] = React.useState(true)
  const [start, setStart] = React.useState("09:00")
  const [end, setEnd] = React.useState("17:00")

  async function add() {
    if (!date) {
      toast.error("Pick a date")
      return
    }

    const startMin = timeToMinutes(start)
    const endMin = timeToMinutes(end)

    if (!closed && (startMin === null || endMin === null)) {
      toast.error("Enter both times as HH:MM")
      return
    }

    try {
      await upsert.mutateAsync({
        theDate: date,
        isClosed: closed,
        startMin: closed ? undefined : (startMin ?? undefined),
        endMin: closed ? undefined : (endMin ?? undefined),
      })

      toast.success("Date override saved")
      setDate("")
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not save that date"
      )
    }
  }

  return (
    <Card className="mt-4">
      <CardContent className="space-y-4">
        <div>
          <h2 className="font-heading text-xl">Date overrides</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Close a specific day, or open it with different hours. Overrides beat
            the weekly pattern.
          </p>
        </div>

        <div className="border-border flex flex-wrap items-end gap-3 rounded-xl border p-3">
          <Field className="w-auto">
            <FieldLabel htmlFor="override-date">Date</FieldLabel>
            <Input
              id="override-date"
              type="date"
              className="w-44"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </Field>

          <Field orientation="horizontal" className="w-auto">
            <Switch
              id="override-closed"
              checked={closed}
              onCheckedChange={setClosed}
            />
            <FieldLabel htmlFor="override-closed" className="font-normal">
              Unavailable all day
            </FieldLabel>
          </Field>

          {!closed && (
            <>
              <Field className="w-auto">
                <FieldLabel htmlFor="override-start">From</FieldLabel>
                <Input
                  id="override-start"
                  type="time"
                  className="w-32"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                />
              </Field>
              <Field className="w-auto">
                <FieldLabel htmlFor="override-end">To</FieldLabel>
                <Input
                  id="override-end"
                  type="time"
                  className="w-32"
                  value={end}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </Field>
            </>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={add}
            disabled={upsert.isPending}
          >
            {upsert.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Add override
          </Button>
        </div>

        {overrides.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No overrides. Public pages only ever show today onwards, so past
            dates are never exposed.
          </p>
        ) : (
          <ul className="divide-border/60 divide-y">
            {overrides.map((override) => (
              <li
                key={override.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {formatDateOnly(override.theDate)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {override.isClosed
                      ? "Unavailable all day"
                      : `${minutesToTime(override.startMin ?? 0)} – ${minutesToTime(
                          override.endMin ?? 0
                        )}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove override for ${formatDateOnly(override.theDate)}`}
                  onClick={() =>
                    remove.mutate(isoDateOnly(override.theDate), {
                      onError: () => toast.error("Could not remove that"),
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function toDraft(
  rules: Array<{ weekday: number; startMin: number; endMin: number }>
): Draft {
  const draft: Draft = {}

  for (let weekday = 0; weekday < 7; weekday += 1) {
    draft[weekday] = []
  }

  for (const rule of [...rules].sort(
    (a, b) => a.weekday - b.weekday || a.startMin - b.startMin
  )) {
    draft[rule.weekday].push({
      key: nextKey(),
      start: minutesToTime(rule.startMin),
      end: minutesToTime(rule.endMin),
    })
  }

  return draft
}
