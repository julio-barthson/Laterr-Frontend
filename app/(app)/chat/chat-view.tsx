"use client"

import * as React from "react"
import {
  ArrowUp,
  Ban,
  Loader2,
  Mic,
  Sparkles,
  Square,
  Trash2,
  Wrench,
} from "lucide-react"
import { toast } from "sonner"

import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageGroup,
} from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { getErrorMessage } from "@/lib/api/errors"
import {
  transcribe,
  useAiCapabilities,
  useChat,
  type ChatMessage,
} from "@/lib/hooks/use-chat"
import { Markdown } from "@/components/markdown"
import { useVoiceRecorder } from "@/lib/hooks/use-voice-recorder"
import { PageHeader } from "@/components/PageHeader"

/** Openers, so a blank page is not the first thing a user meets. */
const SUGGESTIONS = [
  "What's on my calendar this week?",
  "Book a 30-minute intro call template",
  "Block out next Friday",
  "Who's waiting in my inbox?",
] as const

/** Tool name to a phrase, so the status line reads as English. */
const TOOL_LABEL: Record<string, string> = {
  create_schedule: "adding it to your calendar",
  list_upcoming: "checking your calendar",
  search_schedules: "searching your schedules",
  get_schedule: "reading the details",
  update_schedule: "updating it",
  set_schedule_status: "updating the status",
  delete_schedule: "deleting it",
  draft_followup: "drafting a note",
  create_followup: "saving the check-in",
  list_followups: "checking your follow-ups",
  reply_to_followup: "recording your reply",
  list_event_types: "checking your event types",
  create_event_type: "creating the event type",
  update_event_type: "updating the event type",
  view_availability: "checking your hours",
  add_date_override: "updating that date",
  clear_date_override: "clearing that date",
  list_bookings: "checking your meetings",
  update_booking: "updating the booking",
  list_booking_requests: "checking your inbox",
  respond_booking_request: "responding",
  get_profile: "reading your profile",
  update_profile: "updating your profile",
  get_subscription: "checking your plan",
  list_workspaces: "checking your teams",
  create_workspace: "creating the team",
  invite_to_workspace: "sending the invite",
  get_roles: "checking your roles",
  request_role: "filing the request",
  open_page: "finding the page",
  web_search: "searching the web",
  web_fetch: "reading that page",
}

export function ChatView() {
  const capabilities = useAiCapabilities()
  const { messages, isStreaming, send, stop, reset } = useChat()
  const [draft, setDraft] = React.useState("")

  const canChat = capabilities.data?.chat ?? false

  function submit(text: string) {
    setDraft("")
    void send(text)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4">
      <div className="flex w-full flex-col items-start justify-between gap-2 lg:flex-row lg:items-center">
        <PageHeader
          back
          title={
            <span className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Laterr AI
            </span>
          }
          description={
            "Ask for anything on your account — it can act, not just advise."
          }
        />
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-3xl"></h1>
          <p className="mt-1 text-sm text-muted-foreground"></p>
        </div>
      </header>

      {capabilities.isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : !canChat ? (
        <NotConfigured />
      ) : (
        <>
          <MessageScrollerProvider>
            <MessageScroller className="min-h-0 flex-1">
              <MessageScrollerViewport className="h-full">
                <MessageScrollerContent className="px-1">
                  {messages.length === 0 ? (
                    <Opener onPick={submit} />
                  ) : (
                    <MessageGroup className="gap-4 py-2">
                      {messages.map((message) => (
                        <Turn
                          key={message.id}
                          message={message}
                          streaming={isStreaming}
                        />
                      ))}
                    </MessageGroup>
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>

          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={submit}
            onStop={stop}
            isStreaming={isStreaming}
            voiceEnabled={capabilities.data?.voice ?? false}
          />
        </>
      )}
    </div>
  )
}

function NotConfigured() {
  return (
    <Card>
      <CardContent className="py-10">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Ban />
            </EmptyMedia>
            <EmptyTitle>Laterr AI isn&apos;t switched on</EmptyTitle>
            <EmptyDescription>
              This deployment has no AI credentials configured. Everything else
              in Laterr works as normal.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </CardContent>
    </Card>
  )
}

function Opener({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col justify-center py-10">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Sparkles />
          </EmptyMedia>
          <EmptyTitle>What can I take off your plate?</EmptyTitle>
          <EmptyDescription>
            I can read and change your schedules, event types, availability,
            meetings and teams.
          </EmptyDescription>
        </EmptyHeader>

        <div className="mx-auto flex max-w-lg flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onPick(suggestion)}
              className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-accent"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </Empty>
    </div>
  )
}

function Turn({
  message,
  streaming,
}: {
  message: ChatMessage
  streaming: boolean
}) {
  const isUser = message.role === "user"

  return (
    <Message align={isUser ? "end" : "start"}>
      {!isUser && (
        <MessageAvatar className="h-8 w-8 bg-primary/15 text-primary">
          <Sparkles className="h-4 w-4" />
        </MessageAvatar>
      )}

      <MessageContent>
        {message.tools.length > 0 && (
          <p className="flex items-center gap-1.5 px-1 text-xs text-muted-foreground">
            <Wrench className="h-3 w-3 shrink-0" />
            <span>
              {message.tools
                .map((tool) => TOOL_LABEL[tool] ?? tool.replace(/_/g, " "))
                .join(" · ")}
            </span>
          </p>
        )}

        <Bubble
          variant={isUser ? "default" : "ghost"}
          align={isUser ? "end" : "start"}
        >
          <BubbleContent>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <>
                <Markdown>{message.content}</Markdown>
                {/* Only while this turn is still open and nothing has arrived
                    yet — a persistent spinner on an empty final message would
                    look like a hang. */}
                {streaming &&
                  message.content.length === 0 &&
                  !message.error && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
              </>
            )}
          </BubbleContent>
        </Bubble>

        {message.error && (
          <p className="px-1 text-xs text-destructive">{message.error}</p>
        )}
      </MessageContent>
    </Message>
  )
}

function Composer({
  value,
  onChange,
  onSubmit,
  onStop,
  isStreaming,
  voiceEnabled,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: (text: string) => void
  onStop: () => void
  isStreaming: boolean
  voiceEnabled: boolean
}) {
  const recorder = useVoiceRecorder()
  const [transcribing, setTranscribing] = React.useState(false)

  async function toggleRecording() {
    if (recorder.isRecording) {
      const blob = await recorder.stop()

      if (!blob) return

      setTranscribing(true)

      try {
        const text = await transcribe(blob)

        if (text.trim()) {
          // Appended rather than replacing, so a voice note can extend something
          // already typed.
          onChange(value ? `${value} ${text.trim()}` : text.trim())
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
    <Card className="shrink-0">
      <CardContent className="py-3">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmit(value)
          }}
          className="flex items-end gap-2"
        >
          <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends, Shift+Enter breaks the line — the convention in
              // every chat surface, so the default form behaviour is wrong here.
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                onSubmit(value)
              }
            }}
            placeholder="Ask Laterr AI…"
            rows={1}
            maxLength={20_000}
            disabled={isStreaming}
            className="max-h-40 min-h-10 flex-1 resize-none"
            aria-label="Message"
          />

          {voiceEnabled && (
            <Button
              type="button"
              size="icon"
              variant={recorder.isRecording ? "destructive" : "outline"}
              onClick={() => void toggleRecording()}
              disabled={isStreaming || transcribing}
              aria-label={
                recorder.isRecording ? "Stop recording" : "Record a voice note"
              }
            >
              {transcribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}

          {isStreaming ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={onStop}
              aria-label="Stop generating"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={value.trim().length === 0}
              aria-label="Send"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </form>

        {recorder.isRecording && (
          <p className="mt-2 text-xs text-muted-foreground">
            Recording… tap the microphone again to stop.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
