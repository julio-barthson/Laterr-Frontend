"use client"

import { PageHeader } from "@/components/PageHeader"
import { EventTypeForm } from "../event-type-form"
import { useCreateEventType } from "@/lib/hooks/use-event-types"

export function NewEventType() {
  const create = useCreateEventType()

  return (
    <>
      <PageHeader
        back
        title={"New Event Type"}
        description={"Set it up once, then share the link"}
      />

      <EventTypeForm
        onSubmit={(input) => create.mutateAsync(input)}
        submitLabel="Create event type"
      />
    </>
  )
}
