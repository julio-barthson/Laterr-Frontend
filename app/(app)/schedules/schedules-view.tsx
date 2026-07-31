"use client"

import * as React from "react"
import Link from "next/link"
import {
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { ScheduleDialog } from "./schedule-dialog"
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
import { NativeSelect } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  Schedule,
  ScheduleCategory,
  ScheduleStatus,
} from "@/lib/api/domain-types"
import { CATEGORY_META } from "@/lib/schedule-meta"
import { SCHEDULE_CATEGORIES } from "@/lib/api/schedule-types"
import {
  useDeleteSchedule,
  useScheduleQuota,
  useSchedules,
  useSetScheduleStatus,
} from "@/lib/hooks/use-schedules"

const STATUS_TABS: Array<{ value: ScheduleStatus | "all"; label: string }> = [
  { value: "upcoming", label: "Upcoming" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
]

export function SchedulesView() {
  const [status, setStatus] = React.useState<ScheduleStatus | "all">("upcoming")
  const [category, setCategory] = React.useState<ScheduleCategory | "all">(
    "all"
  )
  const [editing, setEditing] = React.useState<Schedule | null>(null)
  const [creating, setCreating] = React.useState(false)

  const { data: schedules, isLoading } = useSchedules({
    status: status === "all" ? undefined : status,
    category: category === "all" ? undefined : category,
  })
  const { data: quota } = useScheduleQuota()

  const atLimit =
    quota?.limit !== null &&
    quota !== undefined &&
    quota.limit !== null &&
    quota.used >= quota.limit

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl">Schedules</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Meetings, payments, flights, match days and tasks in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* The natural-language capture is the primary path — it is the
              product's whole pitch. The dialog stays as the manual fallback for
              anyone who would rather just fill in fields.

              Rendered as a plain disabled Button at the quota limit rather than
              `asChild` with `disabled`: Slot merges props onto the Link, and
              `disabled` on an anchor does nothing at all — the control would
              look enabled and still navigate. */}
          {atLimit ? (
            <Button className="rounded-full" disabled>
              <Sparkles className="mr-1.5 h-4 w-4" /> New schedule
            </Button>
          ) : (
            <Button asChild className="rounded-full">
              <Link href="/schedules/new">
                <Sparkles className="mr-1.5 h-4 w-4" /> New schedule
              </Link>
            </Button>
          )}
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setCreating(true)}
            // Blocking here is a courtesy — the API enforces the quota itself
            // and returns FREEMIUM_LIMIT regardless.
            disabled={atLimit}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add manually
          </Button>
        </div>
      </header>

      {atLimit && quota && (
        <Card className="mt-6 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>
                You&apos;ve used your {quota.limit} trial schedule
                {quota.limit === 1 ? "" : "s"}
              </CardTitle>
              <CardDescription className="mt-1 text-muted-foreground">
                Upgrade for unlimited schedules. Cancelled and completed ones
                still count toward the trial.
              </CardDescription>
            </div>
            <Button asChild className="rounded-full">
              <Link href="/pricing">See plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Tabs
          value={status}
          onValueChange={(value) => setStatus(value as ScheduleStatus | "all")}
        >
          <TabsList>
            {STATUS_TABS.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <NativeSelect
          aria-label="Filter by category"
          className="w-40"
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as ScheduleCategory | "all")
          }
        >
          <option value="all">All categories</option>
          {SCHEDULE_CATEGORIES.map((value) => (
            <option key={value} value={value} className="capitalize">
              {value}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading &&
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}

        {!isLoading && (schedules ?? []).length === 0 && (
          <Card>
            <CardContent className="py-10 text-center">
              <CardTitle>Nothing here</CardTitle>
              <CardDescription className="mt-1 text-muted-foreground">
                {status === "upcoming"
                  ? "No upcoming schedules. Add one, or ask Laterr AI to capture it for you."
                  : "No schedules match this filter."}
              </CardDescription>
            </CardContent>
          </Card>
        )}

        {(schedules ?? []).map((schedule) => (
          <ScheduleRow
            key={schedule.id}
            schedule={schedule}
            onEdit={() => setEditing(schedule)}
          />
        ))}
      </div>

      {creating && (
        <ScheduleDialog open onOpenChange={() => setCreating(false)} />
      )}
      {editing && (
        <ScheduleDialog
          open
          schedule={editing}
          onOpenChange={() => setEditing(null)}
        />
      )}
    </>
  )
}

function ScheduleRow({
  schedule,
  onEdit,
}: {
  schedule: Schedule
  onEdit: () => void
}) {
  const setStatus = useSetScheduleStatus()
  const remove = useDeleteSchedule()
  const Icon = CATEGORY_META[schedule.category].icon

  const start = new Date(schedule.startsAt)

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Opens the detail page rather than the edit dialog: the title is
                the thing you click to *see* a schedule, and detail is where the
                post-event check-in lives. Editing has its own control below. */}
            <Link
              href={`/schedules/${schedule.id}`}
              className="truncate text-left font-heading text-lg hover:underline"
            >
              {schedule.title}
            </Link>
            <Badge variant="secondary" className="capitalize">
              {schedule.category}
            </Badge>
            {schedule.status !== "upcoming" && (
              <Badge variant="outline" className="capitalize">
                {schedule.status}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <time dateTime={schedule.startsAt}>{start.toLocaleString()}</time>
            {schedule.location ? ` · ${schedule.location}` : ""}
            {schedule.recipient ? ` · ${schedule.recipient}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="mr-1 h-4 w-4" /> Edit
          </Button>

          {schedule.status === "upcoming" && (
            <>
              <Button
                variant="ghost"
                size="sm"
                disabled={setStatus.isPending}
                onClick={() =>
                  setStatus.mutate(
                    { id: schedule.id, status: "done" },
                    { onError: () => toast.error("Could not update that") }
                  )
                }
              >
                <CheckCircle2 className="mr-1 h-4 w-4" /> Done
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={setStatus.isPending}
                onClick={() =>
                  setStatus.mutate(
                    { id: schedule.id, status: "cancelled" },
                    { onError: () => toast.error("Could not update that") }
                  )
                }
              >
                <XCircle className="mr-1 h-4 w-4" /> Cancel
              </Button>
            </>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Delete ${schedule.title}`}
              >
                {remove.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {schedule.title}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This also removes any follow-ups attached to it. On the trial
                  plan, deleting frees up your schedule allowance.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    remove.mutate(schedule.id, {
                      onSuccess: () => toast.success("Schedule deleted"),
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
