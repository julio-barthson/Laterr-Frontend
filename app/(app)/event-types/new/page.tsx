import type { Metadata } from "next"

import { NewEventType } from "./new-event-type"

export const metadata: Metadata = {
  title: "New event type — Laterr",
}

export default function NewEventTypePage() {
  return <NewEventType />
}
