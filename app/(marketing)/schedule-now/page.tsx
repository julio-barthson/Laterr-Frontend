import type { Metadata } from "next"

import { ScheduleNow } from "./schedule-now"

export const metadata: Metadata = {
  title: "Schedule now — Laterr",
  description: "Find a host's booking page by their username.",
  alternates: { canonical: "/schedule-now" },
}

export default function ScheduleNowPage() {
  return <ScheduleNow />
}
