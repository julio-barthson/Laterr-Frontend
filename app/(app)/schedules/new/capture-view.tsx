"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Mic, Sparkles, Square, Wand2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import type { ScheduleCategory } from "@/lib/api/domain-types"
import { getErrorMessage } from "@/lib/api/errors"
import { SCHEDULE_CATEGORIES } from "@/lib/api/schedule-types"
import { transcribe, useAiCapabilities } from "@/lib/hooks/use-chat"
import { useParseSchedule, type ParsedSchedule } from "@/lib/hooks/use-ai"
import { useCreateSchedule, useScheduleQuota } from "@/lib/hooks/use-schedules"
import { useVoiceRecorder } from "@/lib/hooks/use-voice-recorder"
import { CATEGORY_META } from "@/lib/schedule-meta"

const EXAMPLES = [
  "Coffee with Sam next Tuesday at 4pm at Blue Bottle",
  "Pay Amara £250 for the shoot on Friday",
  "Flight BA1476 to Edinburgh on 12 September, 07:40",
  "Five-a-side with the Wednesday lot, 7pm Thursday",
] as const

/**
 * `datetime-local` wants `YYYY-MM-DDTHH:mm` in *local* time, while the API
 * speaks ISO with an offset. These two convert between them without going
 * through a string format that would shift the clock.
 */
function toLocalInput(iso: string): string {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) return ""

  const pad = (value: number) => String(value).padStart(2, "0")

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromLocalInput(value: string): string {
  return new Date(value).toISOString()
}

export function CaptureView() {
  const [text, setText] = React.useState("")
  const [parsed, setParsed] = React.useState<ParsedSchedule | null>(null)

  const parse = useParseSchedule()
  const capabilities = useAiCapabilities()
  const quota = useScheduleQuota()

  const aiOn = capabilities.data?.chat ?? false
  const voiceOn = capabilities.data?.voice ?? false
  // A null limit means unlimited, so only a numeric limit can be reached.
  const atLimit =
    quota.data?.limit != null && quota.data.used >= quota.data.limit

  function extract(input: string) {
    const trimmed = input.trim()

    if (!trimmed) return

    parse.mutate(trimmed, {
      onSuccess: (result) => setParsed(result),
      onError: (error) => toast.error(getErrorMessage(error)),
    })
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
          <Link href="/schedules">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            All schedules
          </Link>
        </Button>
        <h1 className="font-heading text-3xl">New schedule</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Describe it the way you would to a friend.
        </p>
      </div>

      {atLimit && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="text-sm">
            You&apos;ve used your trial schedule.{" "}
            <Link href="/pricing" className="text-primary underline">
              Upgrade
            </Link>{" "}
            to add more.
          </CardContent>
        </Card>
      )}

      {!parsed && (
        <CaptureCard
          text={text}
          onChange={setText}
          onSubmit={extract}
          isPending={parse.isPending}
          aiOn={aiOn}
          voiceOn={voiceOn}
        />
      )}

      {parsed && (
        // Keyed on the parse so a second extraction re-seeds the form from a
        // useState initialiser rather than leaving the first result's values.
        <ConfirmCard
          key={parsed.starts_at + parsed.title}
          parsed={parsed}
          onDiscard={() => setParsed(null)}
        />
      )}
    </div>
  )
}

function CaptureCard({
  text,
  onChange,
  onSubmit,
  isPending,
  aiOn,
  voiceOn,
}: {
  text: string
  onChange: (value: string) => void
  onSubmit: (text: string) => void
  isPending: boolean
  aiOn: boolean
  voiceOn: boolean
}) {
  const recorder = useVoiceRecorder()
  const [transcribing, setTranscribing] = React.useState(false)

  async function toggleRecording() {
    if (recorder.isRecording) {
      const blob = await recorder.stop()

      if (!blob) return

      setTranscribing(true)

      try {
        const spoken = await transcribe(blob)

        if (spoken.trim()) {
          onChange(text ? `${text} ${spoken.trim()}` : spoken.trim())
        } else {
          toast.error("Didn't catch that — try again.")
        }
      } catch (error) {
        toast.error(getErrorMessage(error))
      } finally {
        setTranscribing(false)
      }

      return
    }

    try {
      await recorder.start()
    } catch {
      toast.error("Couldn't access the microphone. Check your permissions.")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary h-4 w-4" />
          Say it in your own words
        </CardTitle>
        <CardDescription>
          {aiOn
            ? "Laterr will pull out the date, place, and everything else. You confirm before anything is saved."
            : "Laterr AI is not configured here, so fill the form in yourself."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit(text)
          }}
          className="space-y-3"
        >
          <Textarea
            value={text}
            onChange={(event) => onChange(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Coffee with Sam next Tuesday at 4pm…"
            disabled={!aiOn}
            aria-label="Describe the schedule"
          />

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="submit"
              className="rounded-full"
              disabled={!aiOn || !text.trim() || isPending}
            >
              {isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-1.5 h-4 w-4" />
              )}
              Read it
            </Button>

            {aiOn && voiceOn && (
              <Button
                type="button"
                variant={recorder.isRecording ? "destructive" : "outline"}
                onClick={() => void toggleRecording()}
                disabled={isPending || transcribing}
              >
                {transcribing ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : recorder.isRecording ? (
                  <Square className="mr-1.5 h-4 w-4" />
                ) : (
                  <Mic className="mr-1.5 h-4 w-4" />
                )}
                {recorder.isRecording ? "Stop" : "Speak"}
              </Button>
            )}

            <Button asChild variant="ghost" className="ml-auto">
              <Link href="/schedules">Fill it in manually</Link>
            </Button>
          </div>
        </form>

        {aiOn && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs">Try one of these:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    onChange(example)
                    onSubmit(example)
                  }}
                  disabled={isPending}
                  className="border-border hover:bg-accent rounded-full border px-3 py-1.5 text-xs disabled:opacity-50"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Everything the model extracted, editable before it is saved.
 *
 * The confirmation step is the point: extraction is a guess, and the original
 * did the same rather than writing straight to the calendar.
 */
function ConfirmCard({
  parsed,
  onDiscard,
}: {
  parsed: ParsedSchedule
  onDiscard: () => void
}) {
  const router = useRouter()
  const create = useCreateSchedule()

  const [category, setCategory] = React.useState<ScheduleCategory>(
    parsed.category
  )
  const [title, setTitle] = React.useState(parsed.title)
  const [startsAt, setStartsAt] = React.useState(toLocalInput(parsed.starts_at))
  const [endsAt, setEndsAt] = React.useState(
    parsed.ends_at ? toLocalInput(parsed.ends_at) : ""
  )
  const [location, setLocation] = React.useState(parsed.location ?? "")
  const [meetingUrl, setMeetingUrl] = React.useState(parsed.meeting_url ?? "")
  const [description, setDescription] = React.useState(parsed.description ?? "")
  const [amount, setAmount] = React.useState(
    parsed.amount === null ? "" : String(parsed.amount)
  )
  const [currency, setCurrency] = React.useState(parsed.currency ?? "USD")
  const [recipient, setRecipient] = React.useState(parsed.recipient ?? "")
  const [flightNo, setFlightNo] = React.useState(parsed.flight_no ?? "")
  const [teamName, setTeamName] = React.useState(parsed.team_name ?? "")

  const Icon = CATEGORY_META[category].icon

  function save(event: React.FormEvent) {
    event.preventDefault()

    if (!startsAt) {
      toast.error("Pick a start time.")
      return
    }

    create.mutate(
      {
        category,
        title: title.trim(),
        startsAt: fromLocalInput(startsAt),
        endsAt: endsAt ? fromLocalInput(endsAt) : undefined,
        location: location.trim() || undefined,
        meetingUrl: meetingUrl.trim() || undefined,
        description: description.trim() || undefined,
        amount: amount ? Number(amount) : undefined,
        currency: amount ? currency : undefined,
        recipient: recipient.trim() || undefined,
        flightNo: flightNo.trim() || undefined,
        teamName: teamName.trim() || undefined,
      },
      {
        onSuccess: (schedule) => {
          toast.success("Added to your calendar")
          router.push(`/schedules/${schedule.id}`)
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span
            className={`grid h-9 w-9 place-items-center rounded-xl ${CATEGORY_META[category].tint}`}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div>
            <CardTitle>Does this look right?</CardTitle>
            <CardDescription>
              Change anything before saving. Nothing is on your calendar yet.
            </CardDescription>
          </div>
          <Badge variant="outline" className="ml-auto">
            {CATEGORY_META[category].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={save} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={300}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="category">Category</FieldLabel>
            <NativeSelect
              id="category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as ScheduleCategory)
              }
            >
              {SCHEDULE_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {CATEGORY_META[option].label}
                </option>
              ))}
            </NativeSelect>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="starts-at">Starts</FieldLabel>
              <Input
                id="starts-at"
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ends-at">Ends</FieldLabel>
              <Input
                id="ends-at"
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
              />
              <FieldDescription>Optional.</FieldDescription>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="location">Location</FieldLabel>
            <Input
              id="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={300}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="meeting-url">Meeting link</FieldLabel>
            <Input
              id="meeting-url"
              type="url"
              value={meetingUrl}
              onChange={(event) => setMeetingUrl(event.target.value)}
            />
          </Field>

          {/* Category-specific fields, shown only where they mean something —
              an amount on a five-a-side game is noise. */}
          {category === "payment" && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field className="sm:col-span-1">
                <FieldLabel htmlFor="amount">Amount</FieldLabel>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </Field>
              <Field className="sm:col-span-1">
                <FieldLabel htmlFor="currency">Currency</FieldLabel>
                <Input
                  id="currency"
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value.toUpperCase())
                  }
                  maxLength={3}
                />
              </Field>
              <Field className="sm:col-span-1">
                <FieldLabel htmlFor="recipient">Recipient</FieldLabel>
                <Input
                  id="recipient"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  maxLength={200}
                />
              </Field>
            </div>
          )}

          {category === "flight" && (
            <Field>
              <FieldLabel htmlFor="flight-no">Flight number</FieldLabel>
              <Input
                id="flight-no"
                value={flightNo}
                onChange={(event) => setFlightNo(event.target.value)}
                maxLength={20}
              />
            </Field>
          )}

          {category === "sports" && (
            <Field>
              <FieldLabel htmlFor="team-name">Team</FieldLabel>
              <Input
                id="team-name"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
                maxLength={120}
              />
            </Field>
          )}

          <Field>
            <FieldLabel htmlFor="description">Notes</FieldLabel>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              maxLength={2000}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              className="rounded-full"
              disabled={!title.trim() || create.isPending}
            >
              {create.isPending && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Save to calendar
            </Button>
            <Button type="button" variant="ghost" onClick={onDiscard}>
              Start over
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
