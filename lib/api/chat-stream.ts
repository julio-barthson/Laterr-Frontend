import { refreshSession } from "@/lib/api/client"
import { API_BASE_URL } from "@/lib/api/config"
import { ApiError, type ApiErrorBody } from "@/lib/api/errors"

/** One frame from POST /ai/chat, matching the backend's ChatEvent union. */
export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "tool"; name: string }
  | { type: "error"; message: string }
  | { type: "done" }

export interface ChatTurn {
  role: "user" | "assistant"
  content: string
}

/**
 * Streams a chat turn as Server-Sent Events.
 *
 * `fetch` rather than `EventSource`: EventSource is GET-only and cannot send
 * credentials to a cross-origin API, and this needs both a POST body and the
 * session cookie.
 *
 * Failures split in two, and the distinction matters to the caller. Before the
 * first byte the server can still answer with a status, so a 401 or 503 arrives
 * as an `ApiError` thrown from here. After that the response is already a 200
 * and the only channel left is an `error` frame in the stream, which is yielded
 * like any other event.
 */
export async function* streamChat(
  messages: ChatTurn[],
  timezone: string,
  signal?: AbortSignal
): AsyncGenerator<ChatEvent> {
  const send = () =>
    fetch(`${API_BASE_URL}/ai/chat`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, timezone }),
      signal,
    })

  let response = await send()

  // This route does not go through `apiFetch`, so it needs the same
  // refresh-and-retry treatment: a chat turn started just after the 15-minute
  // access token expired would otherwise fail where every other call recovers.
  // One retry only — a second 401 means the session is genuinely gone.
  if (response.status === 401 && (await refreshSession())) {
    response = await send()
  }

  if (!response.ok) {
    let body: Partial<ApiErrorBody> | null = null

    try {
      body = (await response.json()) as Partial<ApiErrorBody>
    } catch {
      // A non-JSON error body is possible from a proxy; ApiError copes with null.
    }

    throw new ApiError(response.status, body)
  }

  if (!response.body) {
    throw new ApiError(502, { message: "The server sent an empty response." })
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      // `stream: true` keeps a multi-byte character split across two chunks
      // intact instead of emitting a replacement character.
      buffer += decoder.decode(value, { stream: true })

      // SSE frames are separated by a blank line. Anything after the last one is
      // a partial frame and stays in the buffer.
      const frames = buffer.split("\n\n")
      buffer = frames.pop() ?? ""

      for (const frame of frames) {
        const line = frame.split("\n").find((part) => part.startsWith("data: "))

        if (!line) continue

        try {
          yield JSON.parse(line.slice(6)) as ChatEvent
        } catch {
          // Ignore a frame we cannot parse rather than killing the turn.
        }
      }
    }
  } finally {
    // Releasing the lock lets the connection be torn down promptly when the
    // consumer breaks out early — otherwise an abandoned turn keeps streaming.
    reader.releaseLock()
  }
}
