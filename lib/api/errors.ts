/**
 * Error body produced by the API's AllExceptionsFilter. Every non-2xx response
 * from the backend uses this shape, so there is exactly one thing to parse.
 */
export interface ApiErrorBody {
  statusCode: number
  message: string | string[]
  error: string
  path: string
  timestamp: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  /** Validation failures arrive as an array; scalars are normalised into one. */
  readonly messages: string[]

  constructor(status: number, body: Partial<ApiErrorBody> | null) {
    const messages = normaliseMessages(body?.message)

    super(messages[0] ?? `Request failed with status ${status}`)

    this.name = "ApiError"
    this.status = status
    this.code = body?.error ?? "UnknownError"
    this.messages = messages
  }

  get isUnauthorized() {
    return this.status === 401
  }

  get isForbidden() {
    return this.status === 403
  }

  get isNotFound() {
    return this.status === 404
  }

  /** True for validation problems worth rendering next to form fields. */
  get isValidation() {
    return this.status === 400 || this.status === 422
  }
}

/**
 * Message to show a user for any thrown value.
 *
 * The API always sends something readable, so an ApiError's own message is
 * preferred over a generic string. `fallback` covers the cases that never
 * reached the API at all — a dropped connection, an aborted fetch.
 */
export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message
  }

  return fallback
}

function normaliseMessages(message: string | string[] | undefined): string[] {
  if (Array.isArray(message)) {
    return message
  }

  if (typeof message === "string" && message.length > 0) {
    return [message]
  }

  return []
}
