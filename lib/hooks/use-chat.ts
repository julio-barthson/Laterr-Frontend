"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import { streamChat, type ChatTurn } from "@/lib/api/chat-stream"
import { getErrorMessage } from "@/lib/api/errors"
import { browserTimezone } from "@/lib/time"

export interface AiCapabilities {
  chat: boolean
  voice: boolean
}

export function useAiCapabilities() {
  return useQuery({
    queryKey: ["ai-capabilities"],
    queryFn: () => api.get<AiCapabilities>("/ai/capabilities"),
    staleTime: 5 * 60_000,
  })
}

export interface ChatMessage extends ChatTurn {
  id: string
  /** Tool names used while producing this reply, in order, deduplicated. */
  tools: string[]
  /** Set when the turn failed; the bubble renders it as a problem, not a reply. */
  error?: string
}

let nextId = 0
const newId = () => `m${(nextId += 1)}`

/**
 * Chat transcript plus the send loop.
 *
 * Deliberately not React Query: a streaming turn mutates one message many times
 * a second, and pushing that through the query cache would either thrash it or
 * need a mutable ref anyway. The transcript is component state and the stream
 * writes into it directly.
 */
export function useChat() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [isStreaming, setStreaming] = React.useState(false)
  const abortRef = React.useRef<AbortController | null>(null)

  // Aborting on unmount stops the server from generating into a socket nobody
  // will read — the controller watches for `close`.
  React.useEffect(() => () => abortRef.current?.abort(), [])

  const stop = React.useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
  }, [])

  const send = React.useCallback(
    async (text: string) => {
      const content = text.trim()

      if (!content || isStreaming) return

      const userMessage: ChatMessage = {
        id: newId(),
        role: "user",
        content,
        tools: [],
      }

      const replyId = newId()

      // The history sent upstream is the transcript *before* this turn plus the
      // new message — read from the state updater rather than the closure so a
      // fast second send cannot drop the message in between.
      let history: ChatTurn[] = []

      setMessages((current) => {
        history = [...current, userMessage]
          .filter((message) => !message.error)
          .map((message) => ({ role: message.role, content: message.content }))

        return [
          ...current,
          userMessage,
          { id: replyId, role: "assistant", content: "", tools: [] },
        ]
      })

      const controller = new AbortController()
      abortRef.current = controller
      setStreaming(true)

      const patch = (change: (message: ChatMessage) => ChatMessage) =>
        setMessages((current) =>
          current.map((message) =>
            message.id === replyId ? change(message) : message
          )
        )

      try {
        for await (const event of streamChat(
          history,
          browserTimezone(),
          controller.signal
        )) {
          if (event.type === "text") {
            patch((message) => ({
              ...message,
              content: message.content + event.text,
            }))
          } else if (event.type === "tool") {
            patch((message) =>
              message.tools.includes(event.name)
                ? message
                : { ...message, tools: [...message.tools, event.name] }
            )
          } else if (event.type === "error") {
            patch((message) => ({ ...message, error: event.message }))
          }
        }
      } catch (error) {
        // An abort is the user pressing stop, not a failure. Whatever streamed
        // before it stays in the transcript.
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          patch((message) => ({ ...message, error: getErrorMessage(error) }))
        }
      } finally {
        // Drop a reply that produced nothing at all, so a failed turn does not
        // leave an empty bubble behind.
        setMessages((current) =>
          current.filter(
            (message) =>
              message.id !== replyId ||
              message.content.length > 0 ||
              message.error !== undefined
          )
        )

        abortRef.current = null
        setStreaming(false)
      }
    },
    [isStreaming]
  )

  const reset = React.useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStreaming(false)
    setMessages([])
  }, [])

  return { messages, isStreaming, send, stop, reset }
}

/** Uploads a recording and returns the transcript. */
export async function transcribe(blob: Blob): Promise<string> {
  const form = new FormData()
  form.append("audio", blob, "voice.webm")

  const { text } = await api.post<{ text: string }>("/ai/transcribe", form)

  return text
}
