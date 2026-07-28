import { API_BASE_URL, isAuthEndpoint } from "./config"
import { ApiError, type ApiErrorBody } from "./errors"

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** Serialised as JSON unless it is already a FormData/Blob/string. */
  body?: unknown
  /** Appended as a query string; null and undefined values are dropped. */
  query?: Record<string, string | number | boolean | null | undefined>
}

/**
 * Browser-side API client.
 *
 * Access and refresh tokens live in httpOnly cookies, so nothing here reads or
 * writes them directly — `credentials: "include"` is what carries them, and it
 * is why the API's CORS origin has to be an explicit allowlist.
 *
 * On a 401 the request is retried once behind a single refresh attempt. The
 * refresh is single-flighted: if ten queries 401 at the same moment, one
 * refresh runs and all ten wait on it, rather than ten refreshes racing to
 * rotate the same token.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const response = await performRequest(path, options)

  if (response.status === 401 && !isAuthEndpoint(path)) {
    const refreshed = await refreshSession()

    if (refreshed) {
      return parseResponse<T>(await performRequest(path, options))
    }
  }

  return parseResponse<T>(response)
}

async function performRequest(path: string, options: ApiFetchOptions) {
  const { body, query, headers, ...rest } = options

  const url = new URL(`${API_BASE_URL}${path}`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const requestHeaders = new Headers(headers)
  let requestBody: BodyInit | undefined

  if (body !== undefined) {
    if (isRawBody(body)) {
      requestBody = body
    } else {
      requestBody = JSON.stringify(body)

      if (!requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "application/json")
      }
    }
  }

  return fetch(url, {
    ...rest,
    headers: requestHeaders,
    body: requestBody,
    credentials: "include",
  })
}

let refreshPromise: Promise<boolean> | null = null

/**
 * Exported so the SSE chat stream shares this single-flight refresh rather than
 * running its own. Two independent refresh paths would race on a expired
 * session: whichever rotated second would present an already-revoked refresh
 * token, and reuse detection revokes the whole chain — signing the user out.
 */
export function refreshSession(): Promise<boolean> {
  refreshPromise ??= (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      })

      return response.ok
    } catch {
      return false
    } finally {
      // Cleared after the in-flight attempt settles so a later 401 can start a
      // fresh refresh rather than reusing this (already resolved) result.
      refreshPromise = null
    }
  })()

  return refreshPromise
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  const isJson = response.headers
    .get("content-type")
    ?.includes("application/json")

  const payload = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    throw new ApiError(response.status, payload as Partial<ApiErrorBody> | null)
  }

  return payload as T
}

function isRawBody(body: unknown): body is BodyInit {
  return (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof URLSearchParams
  )
}

export const api = {
  get: <T>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "PUT", body }),
  delete: <T>(path: string, options?: ApiFetchOptions) =>
    apiFetch<T>(path, { ...options, method: "DELETE" }),
}
