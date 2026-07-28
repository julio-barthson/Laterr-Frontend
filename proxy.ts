import { NextResponse, type NextRequest } from "next/server"

/**
 * Redirects obviously-signed-out visitors away from app routes.
 *
 * This is a UX affordance, NOT a security boundary. It can only see whether an
 * auth cookie is *present* — the token is signed with a secret that lives only
 * in the API, so nothing here can tell a valid token from a forged or expired
 * one. Every real authorization decision is made by the API's guards.
 *
 * Renamed from `middleware.ts`: Next 16 deprecated that filename in favour of
 * `proxy`, and the `proxy` runtime is nodejs and not configurable.
 */
const ACCESS_COOKIE = "laterr_access"
const REFRESH_COOKIE = "laterr_refresh"

/** Route prefixes that require a session. */
const PROTECTED_PREFIXES = [
  "/app",
  "/availability",
  "/chat",
  "/event-types",
  "/inbox",
  "/meetings",
  "/roles",
  "/schedules",
  "/settings",
  "/workspaces",
  "/admin",
  "/owner",
]

/** Routes a signed-in user should be bounced away from. */
const GUEST_ONLY_PREFIXES = ["/auth"]

function isMatch(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // The OAuth return lands here with fresh cookies and must be allowed to run
  // its own redirect, or a signed-in user would bounce straight back to /auth.
  if (pathname === "/auth/callback") {
    return NextResponse.next()
  }

  const hasSession =
    request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE)

  if (!hasSession && isMatch(pathname, PROTECTED_PREFIXES)) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth"
    // Preserve where they were headed so sign-in can return them there.
    url.search = `?next=${encodeURIComponent(pathname + search)}`

    return NextResponse.redirect(url)
  }

  if (hasSession && isMatch(pathname, GUEST_ONLY_PREFIXES)) {
    const url = request.nextUrl.clone()
    url.pathname = "/app"
    url.search = ""

    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  /**
   * Skip Next internals, the favicon and anything with a file extension.
   * Public booking pages are deliberately absent from both lists — they must
   * work signed in or out.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
}
