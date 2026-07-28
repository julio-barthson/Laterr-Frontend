"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "@/lib/auth/use-session"

/**
 * Client-side gate for the authenticated routes.
 *
 * `proxy.ts` handles this when the API shares the site's origin, but it cannot
 * when the API is on another domain — cookies are scoped by host, so the
 * middleware sees nothing and has to let everyone through. This asks the API
 * who the caller is and redirects if the answer is nobody.
 *
 * Neither of these is the security boundary; the API's guards are. This exists
 * so a signed-out visitor gets sent to sign in rather than watching a shell fill
 * with 401s.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useSession()

  const signedOut = !isLoading && !user

  React.useEffect(() => {
    if (!signedOut) return

    // Preserved so signing in returns them where they were headed, matching
    // what the proxy does on a same-origin deployment.
    const next = encodeURIComponent(pathname)
    router.replace(`/auth?next=${next}`)
  }, [signedOut, pathname, router])

  if (isLoading || signedOut) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  return <>{children}</>
}
