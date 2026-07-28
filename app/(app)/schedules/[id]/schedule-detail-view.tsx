"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircleHeart,
  RotateCcw,
  Send,
  Trash2,
  X,
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
import { api } from "@/lib/api/client"
import type { Schedule } from "@/lib/api/domain-types"
import { getErrorMessage } from "@/lib/api/errors"
import {
  useCreateFollowup,
  useDraftFollowup,
  useFollowups,
  useReplyToFollowupAi,
  useSaveFollowupReply,
  type Followup,
} from "@/lib/hooks/use-ai"
import { useAiCapabilities } from "@/lib/hooks/use-chat"
import { useDeleteSchedule, useSetScheduleStatus } from "@/lib/hooks/use-schedules"
import {
  CATEGORY_META,
  STATUS_TINT,
  formatMoney,
  formatWhen,
} from "@/lib/schedule-meta"

export function ScheduleDetailView({ id }: { id: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["schedule", id],
    queryFn: () => api.get<Schedule>(`/schedules/${id}`),
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/schedules">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          All schedules
        </Link>
      </Button>

      {isLoading ? (
        <>
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </>
      ) : error ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-medium">This schedule isn&apos;t available</p>
            <p className="text-muted-foreground mt-1 text-sm">
              It may have been deleted, or it may belong to someone else.
            </p>
          </CardContent>
        </Card>
      ) : data ? (
        <Detail schedule={data} />
      ) : null}
    </div>
  )
}

function Detail({ schedule }: { schedule: Schedule }) {
  const router = useRouter()
  const setStatus = useSetScheduleStatus()
  const remove = useDeleteSchedule()

  const meta = CATEGORY_META[schedule.category]
  const Icon = meta.icon

  // Pinned once: reading the clock during render is impure, and a bubble that
  // appears mid-session because time passed is worse than one that appears on
  // the next navigation.
  const [now] = React.useState(() => Date.now())
  const isPast = new Date(schedule.startsAt).getTime() < now

  function updateStatus(status: "done" | "cancelled" | "rescheduled") {
    setStatus.mutate(
      { id: schedule.id, status },
      {
        onSuccess: () => toast.success("Updated"),
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    )
  }

  return (
    <>
      <div className="flex items-start gap-4">
        <span
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${meta.tint}`}
        >
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs uppercase tracking-widest">
            {meta.label}
          </p>
          <h1 className="font-heading text-3xl md:text-4xl">
            {schedule.title}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatWhen(schedule.startsAt)}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 capitalize ${STATUS_TINT[schedule.status]}`}
        >
          {schedule.status}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {schedule.location && (
          <Info icon={MapPin} label="Location">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                schedule.location
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              {schedule.location}
            </a>
          </Info>
        )}
        {schedule.meetingUrl && (
          <Info icon={ExternalLink} label={schedule.provider ?? "Meeting"}>
            <a
              href={schedule.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Open link
            </a>
          </Info>
        )}
        {schedule.amount !== null && (
          <Info label="Amount">
            {formatMoney(Number(schedule.amount), schedule.currency)}
          </Info>
        )}
        {schedule.recipient && (
          <Info label="Recipient">{schedule.recipient}</Info>
        )}
        {schedule.flightNo && <Info label="Flight">{schedule.flightNo}</Info>}
        {schedule.teamName && <Info label="Team">{schedule.teamName}</Info>}
      </div>

      {schedule.description && (
        <Card>
          <CardContent className="text-sm">{schedule.description}</CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {schedule.status === "upcoming" && (
          <>
            <Button
              className="rounded-full"
              disabled={setStatus.isPending}
              onClick={() => updateStatus("done")}
            >
              <Check className="mr-1.5 h-4 w-4" />
              Mark as done
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              disabled={setStatus.isPending}
              onClick={() => updateStatus("rescheduled")}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Rescheduled
            </Button>
            <Button
              variant="outline"
              className="rounded-full"
              disabled={setStatus.isPending}
              onClick={() => updateStatus("cancelled")}
            >
              <X className="mr-1.5 h-4 w-4" />
              Cancel
            </Button>
          </>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              className="text-muted-foreground hover:text-destructive ml-auto"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete &ldquo;{schedule.title}&rdquo;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. Any check-ins saved against it go too.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  remove.mutate(schedule.id, {
                    onSuccess: () => {
                      toast.success("Deleted")
                      router.push("/schedules")
                    },
                    onError: (error) => toast.error(getErrorMessage(error)),
                  })
                }
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {isPast && <CheckIn schedule={schedule} />}
    </>
  )
}

function Info({
  icon: Icon,
  label,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs uppercase tracking-wide">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {label}
        </div>
        <div className="mt-1 text-sm">{children}</div>
      </CardContent>
    </Card>
  )
}

/**
 * The warm check-in, shown once the event is in the past.
 *
 * Unlike the original this persists: it drafted a message and a reply and then
 * discarded both on navigation, even though `followups` has columns for exactly
 * this. Saving means the AI tools (`list_followups`, `reply_to_followup`) and
 * this page read the same rows.
 */
function CheckIn({ schedule }: { schedule: Schedule }) {
  const capabilities = useAiCapabilities()
  const { data: saved, isLoading } = useFollowups(schedule.id)

  const draft = useDraftFollowup()
  const create = useCreateFollowup()

  const aiOn = capabilities.data?.chat ?? false
  const existing = saved?.[0]

  function ask() {
    draft.mutate(
      {
        category: schedule.category,
        title: schedule.title,
        location: schedule.location,
        recipient: schedule.recipient,
      },
      {
        onSuccess: (drafted) =>
          create.mutate(
            {
              scheduleId: schedule.id,
              message: drafted.message,
              quickReplies: drafted.quick_replies,
            },
            {
              onError: (error) => toast.error(getErrorMessage(error)),
            }
          ),
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    )
  }

  const busy = draft.isPending || create.isPending

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircleHeart className="text-primary h-5 w-5" />
          <p className="font-heading text-xl">A little check-in from Laterr</p>
        </div>

        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : existing ? (
          <Conversation followup={existing} schedule={schedule} />
        ) : !aiOn ? (
          <p className="text-muted-foreground text-sm">
            Laterr AI is not configured here, so check-ins are unavailable.
          </p>
        ) : (
          <Button className="rounded-full" disabled={busy} onClick={ask}>
            {busy ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <MessageCircleHeart className="mr-1.5 h-4 w-4" />
            )}
            Ask how it went
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function Conversation({
  followup,
  schedule,
}: {
  followup: Followup
  schedule: Schedule
}) {
  const [reply, setReply] = React.useState("")

  const respond = useReplyToFollowupAi()
  const save = useSaveFollowupReply()

  const answered = followup.userReply !== null

  function send(text: string) {
    const trimmed = text.trim()

    if (!trimmed) return

    respond.mutate(
      {
        context: `${schedule.category}: ${schedule.title}`,
        userReply: trimmed,
      },
      {
        // Saved together so a refresh shows the whole exchange, not half of it.
        onSuccess: (result) =>
          save.mutate(
            {
              id: followup.id,
              userReply: trimmed,
              aiReply: result.reply || undefined,
            },
            { onError: (error) => toast.error(getErrorMessage(error)) }
          ),
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    )
  }

  const busy = respond.isPending || save.isPending

  return (
    <div className="space-y-3">
      <div className="bg-card w-fit max-w-[85%] rounded-2xl p-4 text-sm">
        {followup.message}
      </div>

      {answered ? (
        <>
          <div className="bg-primary text-primary-foreground ml-auto w-fit max-w-[85%] rounded-2xl p-4 text-sm">
            {followup.userReply}
          </div>
          {followup.aiReply && (
            <div className="bg-card w-fit max-w-[85%] rounded-2xl p-4 text-sm">
              {followup.aiReply}
            </div>
          )}
        </>
      ) : (
        <>
          {followup.quickReplies && followup.quickReplies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {followup.quickReplies.map((quick) => (
                <button
                  key={quick}
                  type="button"
                  disabled={busy}
                  onClick={() => send(quick)}
                  className="border-border bg-background hover:bg-accent rounded-full border px-4 py-1.5 text-xs disabled:opacity-50"
                >
                  {quick}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(event) => {
              event.preventDefault()
              send(reply)
            }}
            className="flex gap-2"
          >
            <Input
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Or say something in your own words…"
              maxLength={500}
              disabled={busy}
              aria-label="Your reply"
            />
            <Button
              type="submit"
              size="icon"
              disabled={busy || !reply.trim()}
              aria-label="Send reply"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </>
      )}
    </div>
  )
}
