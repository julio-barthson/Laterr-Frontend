"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { UpgradeDialog } from "@/components/billing/upgrade-dialog"
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
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api/errors"
import type { Schedule } from "@/lib/api/domain-types"
import { SCHEDULE_CATEGORIES } from "@/lib/api/schedule-types"
import {
  useCreateSchedule,
  useUpdateSchedule,
  type ScheduleInput,
} from "@/lib/hooks/use-schedules"

const schema = z.object({
  category: z.enum(["meeting", "payment", "flight", "sports", "task"]),
  title: z.string().trim().min(1, "Give it a title").max(200),
  description: z.string().max(2000).optional(),
  /** datetime-local value, e.g. 2026-09-01T09:00 — no timezone suffix. */
  startsAtLocal: z.string().min(1, "Pick a start time"),
  endsAtLocal: z.string().optional(),
  location: z.string().max(300).optional(),
  meetingUrl: z.string().max(1000).optional(),
  provider: z.string().max(50).optional(),
  amount: z.string().max(20).optional(),
  currency: z.string().max(6).optional(),
  recipient: z.string().max(200).optional(),
  flightNo: z.string().max(30).optional(),
  teamName: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
})

type FormValues = z.infer<typeof schema>

export function ScheduleDialog({
  open,
  schedule,
  onOpenChange,
}: {
  open: boolean
  schedule?: Schedule
  onOpenChange: (open: boolean) => void
}) {
  const create = useCreateSchedule()
  const update = useUpdateSchedule(schedule?.id ?? "")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: schedule
      ? {
          category: schedule.category,
          title: schedule.title,
          description: schedule.description ?? "",
          startsAtLocal: toLocalInput(schedule.startsAt),
          endsAtLocal: schedule.endsAt ? toLocalInput(schedule.endsAt) : "",
          location: schedule.location ?? "",
          meetingUrl: schedule.meetingUrl ?? "",
          provider: schedule.provider ?? "",
          amount: schedule.amount ?? "",
          currency: schedule.currency ?? "USD",
          recipient: schedule.recipient ?? "",
          flightNo: schedule.flightNo ?? "",
          teamName: schedule.teamName ?? "",
          notes: schedule.notes ?? "",
        }
      : {
          category: "meeting",
          title: "",
          startsAtLocal: "",
          currency: "USD",
        },
  })

  const errors = form.formState.errors
  const [paywallReason, setPaywallReason] = React.useState<string | null>(null)
  // useWatch rather than form.watch(): watch() is not memoizable, which makes
  // the React Compiler skip optimising this component.
  const category = useWatch({ control: form.control, name: "category" })

  async function submit(values: FormValues) {
    const input = toApiInput(values)

    if (input === null) {
      form.setError("endsAtLocal", { message: "End must be after start" })
      return
    }

    try {
      if (schedule) {
        await update.mutateAsync(input)
        toast.success("Schedule updated")
      } else {
        await create.mutateAsync(input)
        toast.success("Schedule created")
      }

      onOpenChange(false)
    } catch (error) {
      if (error instanceof ApiError) {
        // The quota rejection carries a machine-readable code so the paywall
        // can be distinguished from an ordinary permission failure.
        if (error.code === "FREEMIUM_LIMIT") {
          // The paywall, not a toast: the rejection and the way past it belong
          // in the same place.
          setPaywallReason(error.message)
          return
        }

        if (error.isValidation) {
          toast.error(error.messages.join(" · "))
          return
        }

        toast.error(error.message)
        return
      }

      toast.error("Something went wrong")
    }
  }

  if (paywallReason !== null) {
    // Replaces the form rather than stacking a second dialog on it — nested
    // modals fight over focus, and the form is unusable until they upgrade.
    return (
      <UpgradeDialog
        open
        reason={paywallReason}
        onOpenChange={() => {
          setPaywallReason(null)
          onOpenChange(false)
        }}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {schedule ? "Edit schedule" : "New schedule"}
          </DialogTitle>
          <DialogDescription>
            Times are entered and shown in your device&apos;s timezone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="category">Category</FieldLabel>
              <NativeSelect id="category" {...form.register("category")}>
                {SCHEDULE_CATEGORIES.map((value) => (
                  <option key={value} value={value} className="capitalize">
                    {value}
                  </option>
                ))}
              </NativeSelect>
            </Field>

            <Field data-invalid={Boolean(errors.title)}>
              <FieldLabel htmlFor="title">Title</FieldLabel>
              <Input
                id="title"
                placeholder={
                  category === "payment"
                    ? "Pay Sarah for rent"
                    : "Standup with the team"
                }
                {...form.register("title")}
              />
              <FieldError errors={[errors.title]} />
            </Field>

            <Field orientation="responsive">
              <Field data-invalid={Boolean(errors.startsAtLocal)}>
                <FieldLabel htmlFor="startsAtLocal">Starts</FieldLabel>
                <Input
                  id="startsAtLocal"
                  type="datetime-local"
                  {...form.register("startsAtLocal")}
                />
                <FieldError errors={[errors.startsAtLocal]} />
              </Field>
              <Field data-invalid={Boolean(errors.endsAtLocal)}>
                <FieldLabel htmlFor="endsAtLocal">Ends (optional)</FieldLabel>
                <Input
                  id="endsAtLocal"
                  type="datetime-local"
                  {...form.register("endsAtLocal")}
                />
                <FieldError errors={[errors.endsAtLocal]} />
              </Field>
            </Field>

            {category === "payment" && (
              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor="amount">Amount</FieldLabel>
                  <Input
                    id="amount"
                    inputMode="decimal"
                    placeholder="150.00"
                    {...form.register("amount")}
                  />
                  <FieldError errors={[errors.amount]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="currency">Currency</FieldLabel>
                  <Input id="currency" maxLength={6} {...form.register("currency")} />
                </Field>
              </Field>
            )}

            {(category === "payment" || category === "meeting") && (
              <Field>
                <FieldLabel htmlFor="recipient">
                  {category === "payment" ? "Recipient" : "Who with"}
                </FieldLabel>
                <Input id="recipient" {...form.register("recipient")} />
              </Field>
            )}

            {category === "flight" && (
              <Field orientation="responsive">
                <Field>
                  <FieldLabel htmlFor="flightNo">Flight number</FieldLabel>
                  <Input id="flightNo" {...form.register("flightNo")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="provider">Airline</FieldLabel>
                  <Input id="provider" {...form.register("provider")} />
                </Field>
              </Field>
            )}

            {category === "sports" && (
              <Field>
                <FieldLabel htmlFor="teamName">Team</FieldLabel>
                <Input id="teamName" {...form.register("teamName")} />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="location">Location</FieldLabel>
              <Input id="location" {...form.register("location")} />
            </Field>

            {category === "meeting" && (
              <Field>
                <FieldLabel htmlFor="meetingUrl">Meeting link</FieldLabel>
                <Input
                  id="meetingUrl"
                  type="url"
                  placeholder="https://meet.google.com/…"
                  {...form.register("meetingUrl")}
                />
                <FieldDescription>
                  Must include https:// — the API rejects a bare domain.
                </FieldDescription>
                <FieldError errors={[errors.meetingUrl]} />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="notes">Notes</FieldLabel>
              <Textarea id="notes" rows={3} {...form.register("notes")} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {schedule ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * ISO instant to the `datetime-local` format, in the device's timezone.
 *
 * `toISOString().slice(0, 16)` would be wrong here — that yields UTC, so the
 * field would display a different wall-clock time than the user chose.
 */
function toLocalInput(iso: string): string {
  const date = new Date(iso)
  const offsetMs = date.getTimezoneOffset() * 60_000

  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

/** Returns null when the window is inverted, so the caller can flag the field. */
function toApiInput(values: FormValues): ScheduleInput | null {
  // A datetime-local string has no zone, so `new Date` reads it as local time —
  // which is what the user meant. The API stores the resulting instant as UTC.
  const startsAt = new Date(values.startsAtLocal)
  const endsAt = values.endsAtLocal ? new Date(values.endsAtLocal) : undefined

  if (endsAt && endsAt <= startsAt) {
    return null
  }

  const amount = values.amount?.trim() ? Number(values.amount) : undefined

  return {
    category: values.category,
    title: values.title,
    description: values.description || undefined,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt?.toISOString(),
    location: values.location || undefined,
    meetingUrl: values.meetingUrl || undefined,
    provider: values.provider || undefined,
    amount: amount !== undefined && !Number.isNaN(amount) ? amount : undefined,
    currency: values.currency || undefined,
    recipient: values.recipient || undefined,
    flightNo: values.flightNo || undefined,
    teamName: values.teamName || undefined,
    notes: values.notes || undefined,
  }
}
