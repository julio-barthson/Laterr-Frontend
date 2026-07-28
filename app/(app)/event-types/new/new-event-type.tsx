"use client"

import { EventTypeForm } from "../event-type-form"
import { useCreateEventType } from "@/lib/hooks/use-event-types"

export function NewEventType() {
  const create = useCreateEventType()

  return (
    <>
      <header className="mb-6">
        <h1 className="font-heading text-3xl sm:text-4xl">New event type</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Set it up once, then share the link.
        </p>
      </header>

      <EventTypeForm
        onSubmit={(input) => create.mutateAsync(input)}
        submitLabel="Create event type"
      />
    </>
  )
}
