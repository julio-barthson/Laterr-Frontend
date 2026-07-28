import type { Metadata } from "next"

import { EventTypesList } from "./event-types-list"

export const metadata: Metadata = {
  title: "Events — Laterr",
}

export default function EventTypesPage() {
  return <EventTypesList />
}
