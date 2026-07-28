"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"

import { api } from "@/lib/api/client"
import { SESSION_QUERY_KEY } from "@/lib/auth/use-session"
import type { SessionResponse } from "@/lib/auth/types"

/**
 * Where Google sends the browser after the API has set its cookies.
 *
 * The cookies already exist by the time this renders — the work here is only to
 * confirm the session and move on. Confirming rather than assuming matters: if
 * the callback failed partway, the user should land back on /auth instead of an
 * app shell that 401s on every request.
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  React.useEffect(() => {
    let cancelled = false

    async function confirm() {
      try {
        const { user } = await api.get<SessionResponse>("/auth/me")
        if (cancelled) return

        queryClient.setQueryData(SESSION_QUERY_KEY, user)
        router.replace("/app")
      } catch {
        if (cancelled) return
        router.replace("/auth?error=google")
      }
    }

    void confirm()

    return () => {
      cancelled = true
    }
  }, [queryClient, router])

  return (
    <div className="grid min-h-svh place-items-center">
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Finishing sign-in…
      </div>
    </div>
  )
}
