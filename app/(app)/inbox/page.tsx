import type { Metadata } from "next"

import { InboxView } from "./inbox-view"

export const metadata: Metadata = {
  title: "Inbox — Laterr",
  description: "Booking requests waiting on you.",
}

export default function InboxPage() {
  return <InboxView />
}
