"use client"

import Link from "next/link"

import { EventTypeForm } from "../event-type-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useEventType, useUpdateEventType } from "@/lib/hooks/use-event-types"

export function EditEventType({ id }: { id: string }) {
  const { data: eventType, isLoading, isError } = useEventType(id)
  const update = useUpdateEventType(id)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    )
  }

  if (isError || !eventType) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <CardTitle>Event type not found</CardTitle>
          <CardDescription className="mt-1 text-muted-foreground">
            It may have been deleted.
          </CardDescription>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/event-types">Back to events</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <header className="mb-6">
        <h1 className="font-heading text-3xl sm:text-4xl">{eventType.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Changes apply to new bookings. Existing ones keep the details they
          were made with.
        </p>
      </header>

      <EventTypeForm
        eventType={eventType}
        onSubmit={(input) => update.mutateAsync(input)}
        submitLabel="Save changes"
      />
    </>
  )
}
