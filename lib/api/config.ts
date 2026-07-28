/**
 * The Nest API mounts every route under a global `/api` prefix, so the base URL
 * is the backend origin plus that prefix. Shared by the browser and server
 * fetch wrappers.
 */
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL

if (!backendUrl) {
  throw new Error(
    "NEXT_PUBLIC_BACKEND_URL is not set. Copy .env.example to .env."
  )
}

export const API_BASE_URL = `${backendUrl.replace(/\/$/, "")}/api`

/**
 * Endpoints that must never trigger the refresh-and-retry path. A 401 from any
 * of these means the credentials themselves are bad, so retrying would loop.
 */
export const AUTH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
] as const

export function isAuthEndpoint(path: string) {
  return AUTH_ENDPOINTS.some((endpoint) => path.startsWith(endpoint))
}
