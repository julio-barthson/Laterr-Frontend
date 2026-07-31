"use client"

import * as React from "react"
import { Check, Mail, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import type { BookingRequest } from "@/lib/api/domain-types"
import { getErrorMessage } from "@/lib/api/errors"
import {
  useBookingRequests,
  useDeleteBookingRequest,
  useRespondToRequest,
} from "@/lib/hooks/use-bookings"
import { PageHeader } from "@/components/PageHeader"

const STATUS_TONE: Record<string, string> = {
  pending:
    "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
  accepted:
    "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  declined: "",
}

export function InboxView() {
  const { data, isLoading } = useBookingRequests()

  const pending = (data ?? []).filter((row) => row.status === "pending")
  const resolved = (data ?? []).filter((row) => row.status !== "pending")

  return (
    <div className="space-y-6">
      <PageHeader
        back
        title="Booking Requests"
        description="People asking for a slice of your time."
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ) : (data ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Mail />
                </EmptyMedia>
                <EmptyTitle>No requests yet</EmptyTitle>
                <EmptyDescription>
                  Share your booking link from your profile and requests will
                  land here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Waiting on you ({pending.length})
              </h2>
              {pending.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </section>
          )}

          {resolved.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Handled
              </h2>
              {resolved.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function RequestCard({ request }: { request: BookingRequest }) {
  const respond = useRespondToRequest()
  const remove = useDeleteBookingRequest()

  const isPending = request.status === "pending"

  function decide(action: "accept" | "decline") {
    respond.mutate(
      { id: request.id, action },
      {
        onSuccess: () =>
          toast.success(
            action === "accept"
              ? "Accepted — added to your calendar."
              : "Declined."
          ),
        onError: (error) => toast.error(getErrorMessage(error)),
      }
    )
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">
              {request.guestName}
              <span className="font-normal text-muted-foreground">
                {" "}
                · {request.guestEmail}
              </span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Prefers {new Date(request.preferredAt).toLocaleString()}
            </p>
          </div>

          <Badge
            variant="outline"
            className={STATUS_TONE[request.status] ?? ""}
          >
            {request.status}
          </Badge>
        </div>

        {request.message && (
          <p className="rounded-xl bg-muted/50 p-3 text-sm">
            {request.message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {isPending ? (
            <>
              <Button
                size="sm"
                className="rounded-full"
                disabled={respond.isPending}
                onClick={() => decide("accept")}
              >
                <Check className="mr-1.5 h-4 w-4" />
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={respond.isPending}
                onClick={() => decide("decline")}
              >
                <X className="mr-1.5 h-4 w-4" />
                Decline
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              disabled={remove.isPending}
              onClick={() =>
                remove.mutate(request.id, {
                  onSuccess: () => toast.success("Removed"),
                  onError: (error) => toast.error(getErrorMessage(error)),
                })
              }
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
