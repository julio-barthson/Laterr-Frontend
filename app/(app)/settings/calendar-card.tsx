"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarPlus,
  Loader2,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/api/errors"
import {
  useCalendarCapabilities,
  useCalendarConnections,
  useConnectGoogleCalendar,
  useDisconnectCalendar,
  type CalendarConnection,
} from "@/lib/hooks/use-calendar"

/**
 * Connected calendars: conflict detection, and Meet links.
 *
 * The connection reads free/busy to remove times from the booking page, and
 * writes exactly one kind of event — the bookings themselves, which is how a
 * Meet link gets minted. The copy says both plainly, because a host who expects
 * either "nothing is written" or "everything syncs" would be wrong.
 */
export function CalendarCard() {
  const capabilities = useCalendarCapabilities()
  const available = capabilities.data?.google ?? false

  // Only ask for connections once we know the feature exists, so a deployment
  // without credentials makes no pointless request.
  const connections = useCalendarConnections(available)

  useConnectionOutcome()

  // Hidden entirely rather than shown as a dead button on a deployment with no
  // Google credentials configured.
  if (capabilities.isLoading || !available) {
    return null
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Connected calendars</CardTitle>
        <CardDescription>
          Laterr hides times you&apos;re already busy elsewhere, and creates a
          Google Meet link for each booking. It reads only your free/busy times
          — never event details — and the only events it adds are the bookings
          themselves.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {connections.isLoading ? (
          <Skeleton className="h-16 w-full rounded-lg" />
        ) : (
          (connections.data ?? []).map((connection) => (
            <ConnectionRow key={connection.id} connection={connection} />
          ))
        )}

        {!connections.isLoading && (connections.data ?? []).length === 0 && (
          <p className="text-muted-foreground text-sm">
            No calendar connected. Bookings are offered purely from your
            availability hours, so anything booked elsewhere can still be
            double-booked.
          </p>
        )}

        <ConnectButton
          hasConnection={(connections.data ?? []).length > 0}
        />
      </CardContent>
    </Card>
  )
}

function ConnectButton({ hasConnection }: { hasConnection: boolean }) {
  const connect = useConnectGoogleCalendar()

  async function start() {
    try {
      await connect.mutateAsync()
      // On success the browser navigates to Google, so nothing follows.
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={start}
      disabled={connect.isPending}
    >
      {connect.isPending ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <CalendarPlus className="mr-1.5 h-4 w-4" />
      )}
      {hasConnection ? "Connect another" : "Connect Google Calendar"}
    </Button>
  )
}

function ConnectionRow({ connection }: { connection: CalendarConnection }) {
  const disconnect = useDisconnectCalendar()
  const broken = Boolean(connection.syncError)

  async function remove() {
    try {
      await disconnect.mutateAsync(connection.id)
      toast.success("Calendar disconnected")
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="border-border/60 flex flex-wrap items-start gap-3 rounded-lg border p-3">
      <span
        aria-hidden
        className={
          broken
            ? "text-destructive mt-0.5 shrink-0"
            : "text-primary mt-0.5 shrink-0"
        }
      >
        {broken ? (
          <AlertTriangle className="h-5 w-5" />
        ) : (
          <CalendarCheck2 className="h-5 w-5" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {connection.accountEmail}
        </p>

        {!broken && !connection.canCreateMeetLinks && (
          // Granted before Meet links existed: busy detection still works, so
          // this is a prompt rather than an error.
          <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">
            Busy times are syncing, but this connection can&apos;t create
            meeting links yet. Reconnect to allow it.
          </p>
        )}

        {broken ? (
          // Busy lookups fail open, so a broken connection is silently no
          // longer protecting them. Say that outright rather than just showing
          // an error string.
          <p className="text-destructive mt-0.5 text-xs">
            Not syncing — your booking page is not checking this calendar.{" "}
            {connection.syncError}
          </p>
        ) : (
          <p className="text-muted-foreground mt-0.5 text-xs">
            {connection.lastSyncedAt
              ? `Last checked ${formatWhen(connection.lastSyncedAt)}`
              : "Not checked yet — it runs when someone opens your booking page."}
          </p>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={remove}
        disabled={disconnect.isPending}
        aria-label={`Disconnect ${connection.accountEmail}`}
      >
        {disconnect.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}

/**
 * Reports the result of the OAuth round trip.
 *
 * The API redirects back here with `?calendar=…` because the callback is hit by
 * Google, not by the app, so there is no in-page promise to resolve. The params
 * are stripped afterwards so a refresh does not repeat the toast.
 */
function useConnectionOutcome() {
  const params = useSearchParams()
  const router = useRouter()
  const outcome = params.get("calendar")

  React.useEffect(() => {
    if (!outcome) return

    if (outcome === "connected") {
      toast.success("Calendar connected")
    } else if (outcome === "cancelled") {
      toast.info("Calendar connection cancelled")
    } else if (outcome === "failed") {
      toast.error(params.get("reason") ?? "Could not connect that calendar")
    }

    router.replace("/settings")
  }, [outcome, params, router])
}

function formatWhen(iso: string): string {
  const then = new Date(iso)
  const minutes = Math.round((Date.now() - then.getTime()) / 60_000)

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  if (minutes < 24 * 60) return `${Math.round(minutes / 60)}h ago`

  return then.toLocaleDateString()
}
