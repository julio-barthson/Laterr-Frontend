import type { Metadata } from "next"

import { ScheduleDetailView } from "./schedule-detail-view"

export const metadata: Metadata = {
  title: "Schedule — Laterr",
  robots: { index: false, follow: false },
}

/** Params are async in Next 16. */
export default async function SchedulePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return <ScheduleDetailView id={id} />
}
