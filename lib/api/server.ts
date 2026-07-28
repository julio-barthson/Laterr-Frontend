import "server-only"

import { cookies } from "next/headers"

import { API_BASE_URL } from "./config"
import { ApiError, type ApiErrorBody } from "./errors"

export interface ServerApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown
  query?: Record<string, string | number | boolean | null | undefined>
}

/**
 * Server-side API client for Server Components and Route Handlers.
 *
 * There is no browser to carry cookies here, so the incoming request's cookie
 * header is forwarded explicitly. `cookies()` is async as of Next 16 —
 * synchronous access was removed, not just deprecated.
 *
 * Deliberately no refresh-and-retry: a Server Component cannot set cookies
 * during render, so a rotated token would be discarded and the user would land
 * in a loop of silently-expiring sessions. A 401 here surfaces to the caller,
 * which should redirect to /auth and let the browser client handle refresh.
 */
export async function serverApiFetch<T>(
  path: string,
  options: ServerApiOptions = {}
): Promise<T> {
  const { body, query, headers, ...rest } = options

  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  const url = new URL(`${API_BASE_URL}${path}`)

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const requestHeaders = new Headers(headers)

  if (cookieHeader) {
    requestHeaders.set("cookie", cookieHeader)
  }

  let requestBody: BodyInit | undefined

  if (body !== undefined) {
    requestBody = typeof body === "string" ? body : JSON.stringify(body)

    if (!requestHeaders.has("Content-Type")) {
      requestHeaders.set("Content-Type", "application/json")
    }
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    body: requestBody,
    // Authenticated reads must never be served from a shared cache.
    cache: rest.cache ?? "no-store",
  })

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

export const serverApi = {
  get: <T>(path: string, options?: ServerApiOptions) =>
    serverApiFetch<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: ServerApiOptions) =>
    serverApiFetch<T>(path, { ...options, method: "POST", body }),
}
