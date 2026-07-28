import type { Metadata } from "next"

import { EditEventType } from "./edit-event-type"

export const metadata: Metadata = {
  title: "Edit event type — Laterr",
}

/** params is a Promise as of Next 16 — synchronous access was removed. */
export default async function EditEventTypePage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params

  return <EditEventType id={id} />
}
